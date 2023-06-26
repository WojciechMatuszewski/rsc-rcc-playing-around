import {
  Context,
  DynamoDBTransactWriteItemsRequest,
  util
} from "@aws-appsync/utils";

export function request(
  ctx: Context<{ id: string; comment: { content: string } }>
): DynamoDBTransactWriteItemsRequest {
  const commentId = util.autoUlid();

  return {
    operation: "TransactWriteItems",
    transactItems: [
      {
        table: ctx.stash.TABLE_NAME,
        operation: "ConditionCheck",
        key: util.dynamodb.toMapValues({
          pk: `POST#${ctx.arguments.id}`,
          sk: `POST#${ctx.arguments.id}`
        }),
        condition: {
          expression: "attribute_exists(#pk)",
          expressionNames: { "#pk": "pk" },
          returnValuesOnConditionCheckFailure: false
        }
      },
      {
        table: ctx.stash.TABLE_NAME,
        operation: "PutItem",
        attributeValues: util.dynamodb.toMapValues({
          content: ctx.arguments.comment.content,
          post: `POST#${ctx.arguments.id}`
        }),
        key: util.dynamodb.toMapValues({
          pk: `COMMENT#${commentId}`,
          sk: `COMMENT#${commentId}`
        })
      }
    ]
  };
}

export function response(ctx: Context) {
  if (ctx.result.cancellationReasons) {
    util.error("The post does not exist");
  }

  const commentId = ctx.result.keys[1].pk.split("#")[1];
  const content = ctx.arguments.comment.content;

  return {
    id: commentId,
    content
  };
}
