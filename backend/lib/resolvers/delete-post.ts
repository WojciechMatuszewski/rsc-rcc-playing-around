import { Context, DynamoDBDeleteItemRequest } from "@aws-appsync/utils";

export function request(ctx: Context): DynamoDBDeleteItemRequest {
  return {
    operation: "DeleteItem",
    key: util.dynamodb.toMapValues({ pk: "POST", sk: ctx.arguments.id }),
    condition: {
      expression: "attribute_exists(#pk)",
      expressionNames: { "#pk": "pk" }
    }
  };
}

export function response(ctx: Context) {
  const { pk, sk, ...restOfItem } = ctx.result;
  return {
    id: sk,
    ...restOfItem
  };
}
