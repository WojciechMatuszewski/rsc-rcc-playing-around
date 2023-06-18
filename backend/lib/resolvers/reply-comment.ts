import { Context, DynamoDBPutItemRequest, util } from "@aws-appsync/utils";

export function request(ctx: Context): DynamoDBPutItemRequest {
  const id = util.autoUlid();
  const {
    id: commentId,
    comment: { content }
  } = ctx.arguments;

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      pk: `COMMENT#${commentId}`,
      sk: `REPLY#${id}`
    }),
    attributeValues: util.dynamodb.toMapValues({
      content
    })
  };
}

export function response(ctx: Context) {
  const { pk, sk, ...restOfAttributes } = ctx.result;
  const id = sk.split("#")[1];
  const commentId = pk.split("#")[1];

  return {
    id,
    commentId,
    ...restOfAttributes
  };
}
