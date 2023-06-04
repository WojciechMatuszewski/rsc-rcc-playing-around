import { Context, DynamoDBPutItemRequest, util } from "@aws-appsync/utils";

export function request(ctx: Context): DynamoDBPutItemRequest {
  const id = util.autoUlid();
  const { title, author, content } = ctx.arguments.post;

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({ pk: "POST", sk: id }),
    attributeValues: util.dynamodb.toMapValues({
      title,
      author,
      content,
      upVotes: 0,
      downVotes: 0
    })
  };
}

export function response(ctx: Context) {
  const { pk, sk, ...restOfAttributes } = ctx.result;
  return {
    id: sk,
    ...restOfAttributes
  };
}
