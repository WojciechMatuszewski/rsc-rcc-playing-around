import { Context, DynamoDBPutItemRequest, util } from "@aws-appsync/utils";

export function request(ctx: Context): DynamoDBPutItemRequest {
  const id = util.autoUlid();
  const { title, author, content } = ctx.arguments.post;

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({ pk: `POST#${id}`, sk: `POST#${id}` }),
    attributeValues: util.dynamodb.toMapValues({
      title,
      author,
      content,
      upVotes: 0,
      downVotes: 0,
      /**
       * Sparse GSI for getting all the posts
       */
      postsPk: "POST",
      postsSk: util.time.nowEpochSeconds()
    })
  };
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message);
  }

  const { pk, sk, ...restOfAttributes } = ctx.result;
  return {
    id: sk.split("#")[1],
    ...restOfAttributes
  };
}
