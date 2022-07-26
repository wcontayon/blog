---
title: 'Data export system with Azure, SignalR and AspNetCore'
date: 2022-06-28
year: 2022
author: 'wcontayon'
blurb: 'Data export system with Azure, SignalR and AspNetCore'
tags: general, azure, aspnetcore
---

In this article, I'll show how we can implement a background system to export larde data from a SQL Server without freeze your aspnetcore application. This system is deployed on Azure, using Azure Queue, Azure file share, and SignalR. Let's go :sunglasses: .

<br />

## Build a data export system with Azure, SignalR and AspNetCore

In one of my previous project, I was facing an issue about exporting a very large data from SQL server. I found that the code froze the API backend every time with exception like **`TaskCancelledException`**, **`BadHttpExceptions`** or a **`TimeoutException`** on the **`HttpClient`**.
However, the code was not the root cause, it's because we have a lot of rows in our database (more than 80 million rows) that need to be exported. A HttpClient call will be hanged if the SQL query takes to long to be returned (**`TimeoutException`**) or **`TaskCancelledException`**.
And, if we have multiple users that call the export api, the backend goes to be frozen.

To figure out, I've designed a data export system on Azure, using **Azure Queue**, **Azure file share**, **SignalR** and AspNetCore **`IHostedService`**. Let's see how it can be accomplished !

First of all, describe the components of our system.

### Azure Queue

**Azure Queue Storage** is a service for storing large numbers of messages. We can access messages from via authenticated calls with **`HTTP`** and **`HTTPS`**. A message in Azure queue can be up to **64 KB** in size.
A Queue are usually used to create a backlog of task to process. We'll use an **Azure Queue Storage** to store our data export requests to be processed.
> **_NOTE:_** You can learn more about **`Azure Queue Storage`** on [Microsoft Learn](https://docs.microsoft.com/en-us/azure/storage/queues/storage-queues-introduction)



