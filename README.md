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

- The **`__typename` seem to be crucial for fragments to work as expected**.

  - While merging the pagination results, I forgot about to include the `__typename` property into the result. This **resulted in fragments returning no data**.

- The **`loading.tsx` controls whether the first load of the page will show the suspense boundary (the loading file) or block on the data fetch**.

  - I recon this could be pretty neat for SEO – if you want to show the content upfront. Of course there is also a cost associated with blocking the rendering till we have the data.

- **I though that the new CSS dynamic viewport units will solve the issue with horizontal scrollbar when using `100vw` but that is not the case**.

  - I'm referring to [these values](https://www.bram.us/2021/07/08/the-large-small-and-dynamic-viewports/).

  - See [https://github.com/w3c/csswg-drafts/issues/6026#issuecomment-1297193581](this issue).

- From my testing, the RCC `action` prop has some kind of delay in-between I press the button to initialize it, and the moment the UI starts rendering.

  - Pretty weird stuff. **Using the native `onSubmit` feels a bit faster**. I do not see any additional requests made by Next, like in the case of a server action.

    - Maybe parsing the form takes some time? It is an async action so the code might end up in the next tick of the event loop?

- The `useTransition` API is really helpful when dealing with _suspense-enabled_ data-fetching functions like `useSuspenseQuery`.

  - In my case, I wanted to show the loading spinner when the user clicks the "fetch more" button. Since the `useSuspenseQuery` suspends every time user hits this button, it's not possible to show the loading unless you wrap the `fetchMore` with transition.

    - It makes sense as the documentation clearly states that

      > If some state update causes a component to suspend, that state update should be wrapped in a transition.

- **If you use a RCC at the "top-level" you pretty much have no way of rendering the RSC as a child somewhere down the tree**.

  - Of course **you can use children prop**, but imagine wanting to use a RCC for some leaf-level component (or close to a leaf).

    - I understand that RCCs might not be good for leafs, but still, by using RCC at the "parent" you backed yourself into the corner.

      - Of course one can **drill the props with `children`**.

- The **`@property` CSS syntax appears to be scoped to the whole document**. I could not find a way to scope it to a single class, like in the case of custom CSS properties.

  - Such a pity. Now I have to bring in a library to implement and animated counter!

  - If I could scope them to a given class, then [this technique becomes very viable](https://css-tricks.com/animating-number-counters/).

    - After trying for a single element, this technique does not play well with incrementing the counter by very small numbers. The effect is there when incrementing with a very large step.

- When using **GraphQL interfaces, you have to append the `__typename` to the result**. Otherwise the client will not be able to deduce which type is returned. It does make sense.

- It is very **easy to introduce waterfalls when using nested data-structures and data-fetching for those structures in each component**.

  - The way I build the comments is definitely not scalable.

- One **cannot use dynamically created classes when working with Tailwind**.

  - [Consult the docs on this one](https://tailwindcss.com/docs/content-configuration#dynamic-class-names).

  - I guess it's related on how they extract the CSS from the code.

- You **cannot nest the `:has` selectors inside each other**.

  - This means, the following will not work `li:has(ul:not(:has(ul)))`

  - It would be so awesome to be able to do this.

- If you set the `keyArgs` wrong in the Apollo Cache, you will see stale results.

  - In my case, I set the `keyArgs` to a property that does not exist. As such, when navigating between pages, I've seen the same response over and over again.

  - Only after setting the `keyArgs` to either `false` or some property that does change, you will see the correct results.

- I was a bit afraid that it is impossible to early return in the AppSync JavaScript resolvers, especially after reading [this article](https://advancedweb.hu/first-experiences-with-the-new-appsync-javascript-resolver-runtime/#-no-early-return).

  - It turns out, **you can early return from AppSync JavaScript resolvers, via `runtime.earlyReturn`**.

  - The early return is very handy when querying based on the parent. If the parent does not exist, it does not make any sense to perform a DynamoDB query.

- Apparently one cannot use `throw` in AppSync JavaScript resolvers. To yield errors, use the methods on the `util` object.

- Debugging the AWS AppSync JavaScript is better than the VTL counterpart (especially due to the ability to use `console.log`), but I still find it a bit odd that, if you screw up the DynamoDB expression, the errors are silently swallowed.

  - I wasted a lot of time providing the wrong name of the table to the `TransactWriteItems` operation. My guess would be that the operation should fail.

    - That did not happen. Maybe the API of DynamoDB is very forgiving and does not fail for those cases?

- **The DynamoDB documentation recommends using `SET` for counters, but the `SET` operation behaves differently for attributes that does not exist on the item in this context**.

  - If you try to increment an attribute that does not exist on an item yet, you will get an error -> `The provided expression refers to an attribute that does not exist in the item`.

    - The solution is to **combine SET with `if_not_exists`** as [described here](https://dynobase.dev/dynamodb-errors/dynamodb-atomic-counter-not-working/).

- To **go around the lack of environment variables in JS AppSync resolvers, I've used the `ctx.stash`**.

  - Note that we cannot use the bundler for that. When the bundler runs, the CDK tokens are not resolved yet.

- AppSync did not let me to create a resolver for a field defined within an interface.

  - It makes sense from a _programming language perspective_, though I think it would be neat to have `inheritResolversFromInterface` option like in the case of Apollo Server.

- **Consider initializing all the numeric values up-front to their default values**. This might not be possible when your app is in production, but it will save you some time when you are developing.

- While the **AppSync eslint rules are nice, they are not "bulletproof"**. I was trying to use **the `new Date` but the CFN deployment was failing**.

  - It appears that the `new Date` is not supported.

- It is **quite interesting that using the `PutItem` operation in AppSync resolvers returns the data from DynamoDB**.

  - This is **not the default behavior of this operation**. As per documentation

    > The attribute values as they appeared before the PutItem operation, but only if ReturnValues is specified as ALL_OLD in the request. Each element consists of an attribute name and an attribute value.

    This means that **unless you are overriding an item, you should not get any data from DynamoDB**. AppSync must be doing some magic behind the scenes.

  - **The same thing applies to DynamoDB `TransactWrite` call**.

    - If performed via the SDK, the DynamoDB will NOT return you any data related to insertions/deletions. That is not the case with AppSync.

      - AppSync will return the `keys` array that holds the primary/sort keys.

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
