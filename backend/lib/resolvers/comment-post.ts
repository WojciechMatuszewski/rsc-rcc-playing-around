import { Context, DynamoDBPutItemRequest, util } from "@aws-appsync/utils";

export function request(ctx: Context): DynamoDBPutItemRequest {
  const commentId = util.autoUlid();
  const {
    id,
    comment: { content }
  } = ctx.arguments;

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      pk: `POST#${id}`,
      sk: `COMMENT#${commentId}`
    }),
    attributeValues: util.dynamodb.toMapValues({
      content
    })
  };
}

export function response(ctx: Context) {
  const { pk, sk, ...restOfAttributes } = ctx.result;
  const id = sk.split("#")[1];
  const postId = pk.split("#")[1];

  return {
    id,
    postId,
    ...restOfAttributes
  };
}
