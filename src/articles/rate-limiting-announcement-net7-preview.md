---
title: 'Rate Limiting annoucement in .Net7 preview'
date: 2022-07-16
author: 'wcontayon'
blurb: 'Rate Limiting annoucement in .Net7 preview'
tags: general, dotnet, net7preview, aspnetcore
---

.Net team has [announced](https://devblogs.microsoft.com/dotnet/announcing-rate-limiting-for-dotnet/) a built-in support of Rate Limiting in the next release of .net7.

### What is rate limiting ?

**Rate limiting** is a concept of limiting access to resource. For example, we have a resource (database, or file) and we know that our application accesses can handle 20 requests per mintues safely. However, we are not confident about if it can handle more than that. For this reason, we can put a rate limiter in our application that allows 20 requests per every minute and rejects any other more requests before they can access to the resource.
Rate limiting is a excellent way to protect resource from failure due to multiple request more than it can handle.

There are multiple different rate limiting algorithms. The .net preview 7 will support 4 of them.

- Concurrency limit
- Token bucket limit
- Fixed window limit
- Sliding window limit

I’ll provide more technicals details about using Rate Limiting APIs with the built-in [**abstract class RateLimiter**](https://github.com/dotnet/runtime/blob/96cac6b6abceed31332af62db98e490d9df109bb/src/libraries/System.Threading.RateLimiting/src/System/Threading/RateLimiting/RateLimiter.cs#L11) and how to use the different rate limiting algorithms in the next posts.

To find out more about RateLimiter and the rate liminting algorithm you can read the official [annoucement](https://devblogs.microsoft.com/dotnet/announcing-rate-limiting-for-dotnet/) on the Microsoft Blog.