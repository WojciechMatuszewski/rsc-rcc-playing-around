import { Context, DynamoDBGetItemRequest, util } from "@aws-appsync/utils";

/**
 * TODO: handle 404
 */

export function request(ctx: Context): DynamoDBGetItemRequest {
  const { id } = ctx.arguments;

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({ pk: "POST", sk: id })
  };
}

export function response(ctx: Context) {
  const { pk, sk, ...restOfAttributes } = ctx.result;
  return {
    id: sk,
    ...restOfAttributes
  };
}
