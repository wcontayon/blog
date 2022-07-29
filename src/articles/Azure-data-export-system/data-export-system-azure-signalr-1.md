---
title: 'Data export system with Azure and SignalR - Part 1'
date: 2022-06-28
year: 2022
author: 'wcontayon'
blurb: 'Cloud solution: Data export system with Azure and SignalR'
tags: cloud-architecture, azure, aspnetcore
---

In this serie, I'll show how we can implement a background system to export larde data from a SQL Server without freeze your aspnetcore application. This system is deployed on Azure, using Azure Queue, Azure file share, and SignalR. Let's go :sunglasses: .

<br />

## **Part 1** : Description of our solution

In one of my previous project, I was facing an issue about exporting a very large data from SQL server. I found that the code froze the API backend every time with exception like **`TaskCancelledException`**, **`BadHttpExceptions`** or a **`TimeoutException`** on the **`HttpClient`**.
However, the code was not the root cause, it's because we have a lot of rows in our database (more than 80 million rows) that need to be exported. A **`HttpClient`** call will be hanged if the SQL query takes to long to be returned (**`TimeoutException`**) or **`TaskCancelledException`**.

To figure out, I've designed a data export system on Azure, using **Azure Queue**, **Azure file share**, **SignalR** and AspNetCore **`IHostedService`**. Let's see how it can be accomplished !

Here is the design of our solution

<img src="..\assets\articles\img\azure-export-system-design.png" style="width:100%" />

Let's describe our solution and the components

- **Azure Queue Storage** is a service for storing large numbers of messages. We can access messages from via authenticated calls with **`HTTP`** and **`HTTPS`**. A message in Azure queue can be up to **64 KB** in size. It's usually used to create a backlog of task to process. We'll use an **Azure Queue Storage** to store our data export requests to be processed.

> **_NOTE:_** You can learn more about **`Azure Queue Storage`** on [Microsoft docs](https://docs.microsoft.com/en-us/azure/storage/queues/storage-queues-introduction).

<br />

- **Azure files** offers fully managed file shares in the cloud that are accessible via the industry standard Server Message Block (SMB) protocol, Network File System (NFS) protocol, and Azure Files REST API. 
> **_NOTE:_** Lean more about **`Azure files share`** on [Microsoft docs](https://docs.microsoft.com/en-us/azure/storage/files/storage-files-introduction).

<br />

- **SignalR** is a awesome .Net library to add real-time web functionality to AspNetCore applications. It takes advantage of WebSocket, an HTML5 API that enables bi-directional communication between the browser and server.
I'll post some articles on **SignalR** with **`aspnetcore`**.
> **_NOTE:_** More about [SignalR](https://docs.microsoft.com/en-us/aspnet/signalr/overview/getting-started/introduction-to-signalr)

<br />

### How does it works

1. An user ask for a large data to be exported from your application (or any frontend application) by send a request to our **`Backend Api`**. 
2. Our **`Backend Api`** create **Export request message**  and send to our **`Azure Queue`**.
3. Our **`IHostedService`** consume the **export request message**, and process the export by executing a SQL Query (or any long running task to get the data to be export).
4. Once we have the datas (very large datas ...), we create the exported file (csv, xlsx, any other file extension).
5. We upload the created file to our **Azure File Share**.
6. After the file uploaded, we can obtain the download url, and send to our SignalR service.
7. We notify back the user with the url of the file that contains our exported data.

To interact our **Azure Queue** and **Azure File Share**, let's define an interface that will injected in the **`Backend Api`** and in our **`IHostedService`**. 
<br />

Our **`IAzureStorageService`** will have some routine to EnQueue/DeQueue message to/from the **Azure Queue**, and Upload file to **Azure File Share**. 

```csharp
public interface IAzureStorageService
{
    ValueTask<string> UploadToFileShareAsync(Stream streamToUpload, string fileShareFolderName, string fileName);

    ValueTask<string> UploadToFileShareAsync(FileInfo fileToUpload, string fileShareFolderName, string fileName);

    ValueTask<bool> EnQueueAsync(string message);

    ValueTask<string[]> DeQueueAsync(int count = 5);
}
```
<br />

In the next post, we'll implement our solution architecture. We'll go first with our **`IAzureStorageService`** and next we'll see how we can implement our background service to process the queue message with **`IHostedService`**.

<br />

<hr />

## Additional Links
- [Background tasks with hosted services in ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services?view=aspnetcore-6.0&tabs=visual-studio)
- [Introduction to SignalR](https://docs.microsoft.com/en-us/aspnet/signalr/overview/getting-started/introduction-to-signalr)



