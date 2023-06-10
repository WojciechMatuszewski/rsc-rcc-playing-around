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
