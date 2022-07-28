---
title: 'Data export system with Azure, SignalR and AspNetCore'
date: 2022-06-28
year: 2022
publish: draft
draft: true
author: 'wcontayon'
blurb: 'Data export system with Azure, SignalR and AspNetCore'
tags: general, azure, aspnetcore
---

In this article, I'll show how we can implement a background system to export larde data from a SQL Server without freeze your aspnetcore application. This system is deployed on Azure, using Azure Queue, Azure file share, and SignalR. Let's go :sunglasses: .

<br />

## Build a data export system with Azure, SignalR and AspNetCore

In one of my previous project, I was facing an issue about exporting a very large data from SQL server. I found that the code froze the API backend every time with exception like **`TaskCancelledException`**, **`BadHttpExceptions`** or a **`TimeoutException`** on the **`HttpClient`**.
However, the code was not the root cause, it's because we have a lot of rows in our database (more than 80 million rows) that need to be exported. A **`HttpClient`** call will be hanged if the SQL query takes to long to be returned (**`TimeoutException`**) or **`TaskCancelledException`**.

To figure out, I've designed a data export system on Azure, using **Azure Queue**, **Azure file share**, **SignalR** and AspNetCore **`IHostedService`**. Let's see how it can be accomplished !

Here is the design of our solution

<img src="..\assets\articles\img\azure-export-system-design.png">

Let's describe our solution and the components

### Azure Queue
**Azure Queue Storage** is a service for storing large numbers of messages. We can access messages from via authenticated calls with **`HTTP`** and **`HTTPS`**. A message in Azure queue can be up to **64 KB** in size. It's usually used to create a backlog of task to process. We'll use an **Azure Queue Storage** to store our data export requests to be processed.
> **_NOTE:_** You can learn more about **`Azure Queue Storage`** on [Microsoft docs](https://docs.microsoft.com/en-us/azure/storage/queues/storage-queues-introduction).

<br />

### Azure file share
**Azure files** offers fully managed file shares in the cloud that are accessible via the industry standard Server Message Block (SMB) protocol, Network File System (NFS) protocol, and Azure Files REST API. 
> **_NOTE:_** Lean more about **`Azure files share`** on [Microsoft docs](https://docs.microsoft.com/en-us/azure/storage/files/storage-files-introduction).

<br />

### SignalR
**SignalR** is a awesome .Net library to add real-time web functionality to AspNetCore applications. It takes advantage of WebSocket, an HTML5 API that enables bi-directional communication between the browser and server.
I'll post some articles on **SignalR** with **`aspnetcore`**.
> **_NOTE:_** More about [SignalR](https://docs.microsoft.com/en-us/aspnet/signalr/overview/getting-started/introduction-to-signalr)

<br />

In order to follow the step, you need to have an **Azure account**. You can create here [Microsoft Azure](https://azure.microsoft.com/).

#### Step 1: Create an Azure storage account
An **azure storage account** contains all azure storage data objects
- Queue
- Blobs
- Tables
- Disks
- File shares.

It provides a unique namespace for the Azure Storage data, accessible from anywhere over HTTP and HTTPS.






