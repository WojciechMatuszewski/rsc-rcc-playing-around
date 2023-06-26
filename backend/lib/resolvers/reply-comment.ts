import {
  Context,
  DynamoDBTransactWriteItemsRequest,
  util
} from "@aws-appsync/utils";

export function request(
  ctx: Context<{ id: string; comment: { content: string } }>
): DynamoDBTransactWriteItemsRequest {
  const replyId = util.autoUlid();
  const commentId = ctx.args.id;

  return {
    operation: "TransactWriteItems",
    transactItems: [
      {
        table: ctx.stash.TABLE_NAME,
        operation: "UpdateItem",
        key: util.dynamodb.toMapValues({
          pk: `COMMENT#${commentId}`,
          sk: `COMMENT#${commentId}`
        }),
        update: {
          expression: "SET #replies = if_not_exists(#replies, :zero) + :inc",
          expressionNames: { "#replies": "replies" },
          expressionValues: util.dynamodb.toMapValues({
            ":inc": 1,
            ":zero": 0
          })
        },
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
          reply: `COMMENT#${commentId}`
        }),
        key: util.dynamodb.toMapValues({
          pk: `COMMENT#${replyId}`,
          sk: `COMMENT#${replyId}`
        })
      }
    ]
  };
}

export function response(ctx: Context) {
  console.log("HERE", ctx.result);

  if (ctx.result.cancellationReasons) {
    util.error("The comment does not exist");
  }

  const replyId = ctx.result.keys[1].sk.split("#")[1];
  const content = ctx.arguments.comment.content;

  return {
    id: replyId,
    content
  };
}
