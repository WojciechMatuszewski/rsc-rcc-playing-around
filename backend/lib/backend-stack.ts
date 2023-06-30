import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { buildSync } from "esbuild";
import path from "node:path";

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dataTable = new cdk.aws_dynamodb.Table(this, "DataTable", {
      partitionKey: { name: "pk", type: cdk.aws_dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: cdk.aws_dynamodb.AttributeType.STRING },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    dataTable.addGlobalSecondaryIndex({
      indexName: "CommentsByPost",
      partitionKey: {
        name: "post",
        type: cdk.aws_dynamodb.AttributeType.STRING
      },
      sortKey: { name: "pk", type: cdk.aws_dynamodb.AttributeType.STRING }
    });
    dataTable.addGlobalSecondaryIndex({
      indexName: "RepliesByComment",
      partitionKey: {
        name: "reply",
        type: cdk.aws_dynamodb.AttributeType.STRING
      },
      sortKey: { name: "pk", type: cdk.aws_dynamodb.AttributeType.STRING }
    });
    dataTable.addGlobalSecondaryIndex({
      indexName: "PostsByEpoch",
      partitionKey: {
        name: "postsPk",
        type: cdk.aws_dynamodb.AttributeType.STRING
      },
      sortKey: { name: "postsSk", type: cdk.aws_dynamodb.AttributeType.NUMBER }
    });
    new cdk.CfnOutput(this, "DataTableName", { value: dataTable.tableName });

    const api = new cdk.aws_appsync.GraphqlApi(this, "Api", {
      name: "rsc-forum-api",
      schema: cdk.aws_appsync.SchemaFile.fromAsset(
        path.join(__dirname, "./schema.graphql")
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: cdk.aws_appsync.AuthorizationType.API_KEY
        }
      }
    });
    new cdk.CfnOutput(this, "ApiURL", { value: api.graphqlUrl });
    new cdk.CfnOutput(this, "ApiKey", { value: api.apiKey ?? "NOT_DEFINED" });

    const dataSource = api.addDynamoDbDataSource("ds", dataTable);

    new JSResolver(this, "GetPostResolver", {
      api,
      dataSource,
      typeName: "Query",
      fieldName: "post",
      code: cdk.aws_appsync.AssetCode.fromAsset(
        path.join(__dirname, "./resolvers/post.ts")
      )
    });

    new JSResolver(this, "PostsResolver", {
      api,
      dataSource,
      typeName: "Query",
      fieldName: "posts",
      code: cdk.aws_appsync.AssetCode.fromAsset(
        path.join(__dirname, "./resolvers/posts.ts")
      )
    });

    new JSResolver(this, "CreatePostResolver", {
      api,
      dataSource,
      typeName: "Mutation",
      fieldName: "createPost",
      code: cdk.aws_appsync.AssetCode.fromAsset(
        path.join(__dirname, "./resolvers/create-post.ts")
      )
    });

    new JSResolver(this, "DeletePostResolver", {
      api,
      dataSource,
      typeName: "Mutation",
      fieldName: "deletePost",
      code: cdk.aws_appsync.AssetCode.fromAsset(
        path.join(__dirname, "./resolvers/delete-post.ts")
      )
    });

    new JSResolver(this, "UpVotePostResolver", {
      api,
      dataSource,
      typeName: "Mutation",
      fieldName: "upVotePost",
      code: cdk.aws_appsync.AssetCode.fromAsset(
        path.join(__dirname, "./resolvers/upvote-post.ts")
      )
    });

    new JSResolver(this, "DownVotePostResolver", {
      api,
      dataSource,
      typeName: "Mutation",
      fieldName: "downVotePost",
      code: cdk.aws_appsync.AssetCode.fromAsset(
        path.join(__dirname, "./resolvers/downvote-post.ts")
      )
    });

    new JSResolver(this, "CommentPostResolver", {
      api,
      dataSource,
      typeName: "Mutation",
      fieldName: "commentPost",
      code: cdk.aws_appsync.AssetCode.fromAsset(
        path.join(__dirname, "./resolvers/comment-post.ts")
      ),
      environmentVariables: {
        TABLE_NAME: dataTable.tableName
      }
    });

    new JSResolver(this, "PostCommentsResolver", {
      api,
      dataSource,
      typeName: "Query",
      fieldName: "postComments",
      code: cdk.aws_appsync.AssetCode.fromAsset(
        path.join(__dirname, "./resolvers/post-comments.ts")
      )
    });

    new JSResolver(this, "CommentsResolver", {
      api,
      dataSource,
      typeName: "PostComment",
      fieldName: "comments",
      code: cdk.aws_appsync.AssetCode.fromAsset(
        path.join(__dirname, "./resolvers/comments.ts")
      )
    });

    new JSResolver(this, "PostCommentResolver", {
      api,
      dataSource,
      typeName: "Query",
      fieldName: "postComment",
      code: cdk.aws_appsync.AssetCode.fromAsset(
        path.join(__dirname, "./resolvers/post-comment.ts")
      )
    });

    new JSResolver(this, "ReplyCommentResolver", {
      api,
      dataSource,
      typeName: "Mutation",
      fieldName: "replyComment",
      code: cdk.aws_appsync.AssetCode.fromAsset(
        path.join(__dirname, "./resolvers/reply-comment.ts")
      ),
      environmentVariables: {
        TABLE_NAME: dataTable.tableName
      }
    });
  }
}

interface JSResolverProps {
  code: cdk.aws_appsync.AssetCode;
  dataSource: cdk.aws_appsync.DynamoDbDataSource;
  api: cdk.aws_appsync.GraphqlApi;
  typeName: string;
  fieldName: string;
  environmentVariables?: {
    [key: string]: string;
  };
}

class JSResolver extends Construct {
  constructor(scope: Construct, id: string, props: JSResolverProps) {
    super(scope, id);

    const buildResult = buildSync({
      bundle: true,
      write: false,
      platform: "node",
      target: "esnext",
      format: "esm",
      sourcemap: "inline",
      sourcesContent: false,
      outExtension: { ".js": ".mjs" },
      external: ["@aws-appsync/utils"],
      entryPoints: [props.code.path]
      /**
       * We cannot use CDKs values here as they are encoded as tokens.
       * Tokens are not resolved during synthesis and this function runs at synthesis time.
       */
      // define: props.environmentVariables
    });
    if (buildResult.errors.length > 0) {
      throw new Error(buildResult.errors.join("\n"));
    }

    const { api, dataSource, fieldName, typeName } = props;
    const fn = new cdk.aws_appsync.AppsyncFunction(
      this,
      `${typeName}${fieldName}Function`,
      {
        api,
        dataSource,
        name: `${typeName}${fieldName}Function`,
        code: cdk.aws_appsync.InlineCode.fromInline(
          buildResult.outputFiles[0].text
        ),
        runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0
      }
    );
    new cdk.aws_appsync.Resolver(this, `${typeName}${fieldName}Resolver`, {
      api,
      typeName,
      fieldName,
      pipelineConfig: [fn],
      code: cdk.aws_appsync.Code.fromInline(
        [
          `export function request(ctx)  {
            ctx.stash["TABLE_NAME"] = "${props.environmentVariables?.TABLE_NAME}";
            return {}
           }`,
          "export function response(ctx) { return ctx.prev.result }"
        ].join("\n")
      ),
      runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0
    });
  }
}
