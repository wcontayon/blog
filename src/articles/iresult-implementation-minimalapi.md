---
title: 'Custom implementation IResult – Minimal API'
date: 2022-06-11
author: 'wcontayon'
blurb: 'Custom implementation IResult – Minimal API'
tags: general, dotnet, aspnetcore
---

In this article, we will understand the implementation of IResult for custom response in minimal API (.NET6).


**Minimal API** is the new concept introduced by the AspNetCore team with .NET6. It allows you to setup your API with low dependancies and with a minimal ceremony.

The traditional Asp.Net Core application templates are perfect for backend applications, and it has proved his performance over the years. However, to architect microservices and cloud-native applications quickly, those templates can be a little too complex and this is where Minimal APIs becomes usefull.
IResult Interface

**Minimal APIs** introduce the IResult interface, to take control/ customize thes responses by implementing it.

> **_NOTE:_** Here is the defintion of the [IResult](https://github.com/dotnet/aspnetcore/blob/main/src/Http/Http.Abstractions/src/HttpResults/IResult.cs) (some comment are mine)

```csharp
// Licensed to the .NET Foundation under one or more agreements. 
// The .NET Foundation licenses this file to you under the MIT license. 

namespace Microsoft.AspNetCore.Http; 

/// <summary> 
/// Defines a contract that represents the result of an HTTP endpoint. 
/// </summary> 
public interface IResult 
{ 
  /// <summary> 
  /// Write an HTTP response reflecting the result. 
  /// </summary>
  /// <param name="httpContext">The <see cref="HttpContext"/> for the current request.</param> 
  /// <returns>A task that represents the asynchronous execute operation.</returns> 
  Task ExecuteAsync(HttpContext httpContext); // Your custom response treatement will be in this method (wco) 
}
```

The idea behind minimal APIs where based on performance as a primary goal, and as such they are less than MVC framework). One such use case is that by default, minimal APIs only return JSON.

To explore this let’s take an example. Considering the following code:

```csharp
using System.Xml.Serialization; 
using Microsoft.IO;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => new Expert { FirstName = "Comlan William", LastName = "CONTAYON", }); 

app.Run(); 

public class Expert
{ 
   public string? FirstName { get; init; } 
   public string? LastName { get; init; } 
}
```

When we execute the api, the result is ISON serialized

```json
{"firstName":"Andrew","lastName":"Lock"}
```

To return a custom formatted response instead of JSON (let’s say an XML formatted response), we need to implement a custom IResult class.

Following are the code of our custom IResult

> **_NOTE:_** this exemple is inspired from [here (andrew lock blog)](https://andrewlock.net/returning-xml-from-minimal-apis-in-dotnet-6/)


```csharp
using using System.Xml.Serialization;

public class XmlResult<T> : IResult
{
    // Create the serializer that will actually perform the XML serialization
    private static readonly XmlSerializer Serializer = new(typeof(T));

    // The object to serialize
    private readonly T _result;

    public XmlResult(T result)
    {
        _result = result;
    }

    public async Task ExecuteAsync(HttpContext httpContext)
    {
        using var ms = new MemoryStream();

        // Serialize the object synchronously then rewind the stream
        Serializer.Serialize(ms, _result);
        ms.Position = 0;

        httpContext.Response.ContentType = "application/xml";
        await ms.CopyToAsync(httpContext.Response.Body);
    }
}
```

**`The XmlResult<T>`** type implements **`IResult`**, which requires the **`ExecuteAsync`** method. In this method it uses an **`XmlSerializer`** to serialize the provided object to XML to a **`MemoryStream`** and then copies this to the response Body.

> **_NOTE:_** We cannot serialize directly to the Body stream, as that would be a synchronous operation, which is disallowed by default for performance reasons.

To use our new result type, create an instance of it in your API. For example:

```csharp
app.MapGet("/", () => new XmlResult<Person>(new Person
{
    FirstName = "Comlan William",
    LastName = "CONTAYON",
})); 
```
```xml
<Person xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <FirstName>Comlan William</FirstName>
  <LastName>CONTAYON</LastName>
</Person>
```
Registering our custom **`XmlResult`** with **`IResultExtensions`**

**Minimal APIs** typically use the IResult objects exposed on the static Results type. You can return a **404** response using **`Results.NotFound()`** or a **201** response using **`Results.Created()`** for example. These are analogous to the **`NotFound()`** and **`Created()`** methods available on ControllerBase in WebAPIs.

To make it easier to add custom result types, the static Results type includes a property called Extensions:

```csharp
public static partial class Results
{
    public static IResultExtensions Extensions { get; } = new ResultExtensions();
    // ...
}
```

This property is of type **`IResultExtensions`** which is just an empty marker interface:

```csharp
namespace Microsoft.AspNetCore.Http;

public interface IResultExtensions { }

We can’t add methods to the Results type because it’s static, but we can add them to the IResultExtensions marker interface, like the following code:

static class XmlResultExtensions
{
    public static IResult Xml<T>(this IResultExtensions extensions, T result) => new XmlResult<T>()
}
```

With this extension method we avoid having to explicitly specify the generic type parameter as Expert and we know where to look for the available custom **`IResult`** types (they’ll all be on **`Results.Extensions`**):

so our final XML API looks like the following:

```csharp
app.MapGet("/", () => Results.Extensions.Xml(new Expert
{
    FirstName = "Comlan William",
    LastName = "CONTAYON",
}));
```

### Summary

In this post I showed how you could return create a custom from a minimal API by creating a custom IResult type called **`XmlResult<T>`**. Then we created an extension method so that the result is exposed as **`Results.Extensions.Xml()`**. 