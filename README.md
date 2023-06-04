# Playing around with RSCs

## Learnings

- How do I do infinite scroll with the first load being RSC?

  - It is not possible at this very moment. See [this part of the RFC](https://github.com/apollographql/apollo-client-nextjs/blob/pr/RFC-2/RFC.md#getting-data-from-rsc-into-the-ssr-pass).

    - I understand the reasoning, but I still believe that an API like `initialData` would be beneficial.

      - Okay, you could do it by seeding the cache during the SSR, but then you would have duplicate data (one from the RSC, one in the cache).
        Not a problem for a single resource, but a problem for lists – you would have to "skip" the first piece of data.

      - I was able to do it by using the `useLazyQuery`. On the first "fetch more" we would use the token returned from the RSC. Subsequent interactions would use the token returned from the `useLazyQuery` call.

- **AppSync by default obfuscates the DynamoDB pagination token**.

  - A good practice, but it makes it very hard to implement a "correct" pagination where the `nextToken` is undefined without the client needing to perform two fetches.

    - See [this question](https://stackoverflow.com/questions/51693126/why-does-dynamodb-seem-to-inconsistently-return-lastevaluatedkey-when-no-records/71320377#71320377) for more information.

      - Reading more about this "issue", there does not seem to be a good solution for AppSync. Even if you do the mapping via the VTL, the operation returns `NextToken` rather than `LastEvaluatedKey`.

    - I had to use a Lambda resolver to implement this technique

- **If you want to get rid of the Suspense fallback, use the `startTransition`**.

  - I was wondering how I can get rid of the Suspense fallback on subsequent calls to `fetchMore` via the `useSuspenseQuery`.

    - My initial though was to, somehow, disable the suspense for the nth call, but that is not possible.

      - A bit of a mental shift is required to understand all moving parts now.

- I find it a bit weird that the `layout` is not passed the current route path.

  - Here is an [answer from a person working on Next.js](https://github.com/vercel/next.js/issues/43704#issuecomment-1566347726).

- **Handling errors in server actions when those actions are rendered in RSC is quite hard**.

  - If the action fails, and you do not catch the error, Next will reject and bubble up the exception.

    - You **cannot use an `ErrorBoundary` in RSC as it is a client component**.

      - According to Dan, there will be an API to handle it. For now, they recommend setting the state inside the action.

        - I decided to create a client component with a children prop.

      - I **wonder if the `useFormStatus` hook would not be a good place to have an error variable**.

## Summary

- In my humble opinion, the server actions are NOT yet ready for prime time and will not be for a long time.

  - I think the community forgets about how easy it would be to introduce a potential vulnerability when creating endpoint willy-nelly.

    - I have concerns about rate limiting, leaking secrets and so on.

- The ecosystem is yet to catch up with the new architecture.

  - While Next.js leads the way, the state management and data-fetching libraries have a lot to catch up to.

    - I really like how Apollo solved the issue of SSR vs. client-side cache. I no longer have to manually "prime" the cache on the client.

- The model of RSCs makes sense, but I think it is unfortunate that they are named "server components". You do not need the server to use them, they can be "created" during build-time.

  - Having said all of that, I do not have a better suggestion for the name.

- **The `useTransition` API is your friend**.

  - It plays a crucial role in how the Suspense interacts with the fallback prop. Knowing when to use it is quite important.

- **You cannot import RSC into RCC**. If you need to compose them, **use a RSC as a parent and push RSC as RCC children**.
