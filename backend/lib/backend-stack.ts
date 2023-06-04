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

    const getPostsLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "GetPostsLambda",
      {
        entry: path.join(__dirname, "./resolvers/get-posts.ts"),
        handler: "handler",
        environment: {
          TABLE_NAME: dataTable.tableName
        }
      }
    );
    dataTable.grantReadData(getPostsLambda);

    const getPostsLambdaDataSource = api.addLambdaDataSource(
      "GetPostsLambda",
      getPostsLambda
    );

    /**
     * Implements https://stackoverflow.com/a/71320377.
     * Note that the technique described in the above StackOverflow answer
     * is not possible with JS Resolvers or VTL resolvers.
     *
     * It's because, in those environments, AppSync will automatically obfuscate the `LastEvaluatedKey`.
     */
    new cdk.aws_appsync.Resolver(this, "GetPostsResolver", {
      api,
      dataSource: getPostsLambdaDataSource,
      typeName: "Query",
      fieldName: "posts"
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
  }
}

interface JSResolverProps {
  code: cdk.aws_appsync.AssetCode;
  dataSource: cdk.aws_appsync.BaseDataSource;
  api: cdk.aws_appsync.GraphqlApi;
  typeName: string;
  fieldName: string;
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
          "export function request(ctx)  { return {} }",
          "export function response(ctx) { return ctx.prev.result }"
        ].join("\n")
      ),
      runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0
    });
  }
}
