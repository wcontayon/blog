---
title: 'Data export system with Azure and SignalR - Part 2'
date: 2022-06-29
year: 2022
publish: draft
draft: true
author: 'wcontayon'
blurb: 'Cloud solution: Data export system with Azure and SignalR'
tags: cloud-architecture, azure, aspnetcore
---

In the previous post [Data export system with Azure and SignalR - Part 2]('https://wcontayon.github.io/blog/data-export-system-with-azure-and-signalr-part-1'), we described our solution design to implement a Data export system with Azure and SignalR.
In the next words, we'll implement our service code **`IAzureStorageService`** and **`IHostedService`**

<br />

## `IAzureStorageService` implementation
Our **`IAzurestorageService`** will be our helper to upload file to **Azure File Share**, enqueue and dequeue from **Azure Queue**.

First we implement a private funciton to upload a **`File Stream`** to our Azure **File Share**.

```cs
// Import librairies
using Azure;
using Azure.Storage.Queues;
using Azure.Storage.Queues.Models;
using Microsoft.Azure.Storage.DataMovement;
using Microsoft.Azure.Storage.File;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

...

// Upload 
private async ValueTask<string> UploadStreamAsync(
    Stream streamToUpload, 
    string fileShareFolderName, 
    string fileName)
{
    try
    {
        var storageAccountName = "<YOUR AZURE STORAGE ACCOUNT>";
        var fileShareName = "<YOUR AZURE FILE SHARE NAME>";
        var exportDirectory = "<DIRECTORY NAME IN YOUR AZURE FILE SHARE>";
        var azureStorageSecretKey = "<YOUR AZURE STORAGE SECRET KEY>";

        string connexionString = "<YOUR AZURE STORAGE CONNECTION-STRING>";

        CloudFile destinationFile = await AzureStorageHelpers.GetCloudFileAsync(
            fileShareName!, 
            fileName, 
            connexionString, 
            fileShareFolderName);

        await TransferManager.UploadAsync(streamToUpload, destinationFile);

        return destinationFile.Uri.ToString();
    }
    catch (RequestFailedException azureEx)
    {
        // Log error
        return $"Code: {azureEx.ErrorCode} - {azureEx.Message}";
    }
    catch (TransferException trEx)
    {
        // Log error
        return $"{trEx.ErrorCode} - {trEx.Message}";
    }
    catch (Exception ex)
    {
        // Log error
        return $"{ex.Message}";
    }
}
```
We have an **`AzureStorageHelpers`** that helps us to have a [**CloudFile**](https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.storage.file.cloudfile?view=azure-dotnet-legacy) object representing our destination file in **Azure file share**.
```cs
using Microsoft.Azure.Storage;
using Microsoft.Azure.Storage.File;
using System.Threading.Tasks;

namespace ExportDataSystem
{
    public static class AzureStorageHelpers
    {
        /// <summary>
        /// Get a CloudFile instance with the specified name in the given share.
        /// </summary>
        /// <param name="shareName">Share name.</param>
        /// <param name="fileName">File name.</param>
        /// <returns>A <see cref="Task{T}"/> object of type <see cref="CloudFile"/> that represents the asynchronous operation.</returns>
        public static async Task<CloudFile> GetCloudFileAsync(
            string shareName,
            string fileName, 
            string connectionString,
            string folderShareName)
        {
            CloudFileClient client = CloudStorageAccount.Parse(connectionString).CreateCloudFileClient();
            CloudFileShare share = client.GetShareReference(shareName);
            await share.CreateIfNotExistsAsync();

            CloudFileDirectory rootDirectory = share.GetRootDirectoryReference();
            var folderShare = rootDirectory.GetDirectoryReference(folderShareName);
            await folderShare.CreateIfNotExistsAsync();

            return folderShare.GetFileReference(fileName);
        }
    }
}
```

Finally, our **`AzureStorageService`** will look like the following code
```cs
using Azure;
using Azure.Storage.Queues;
using Azure.Storage.Queues.Models;
using Microsoft.Azure.Storage.DataMovement;
using Microsoft.Azure.Storage.File;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace ExportDataSystem
{
    public class AzureStorageService : IAzureStorageService
    {
        public async ValueTask<string[]> DeQueueAsync(int count = 5)
        {
            var queue = await EnsureQueueClient();

            List<string> messages = new List<string>();

            // Get the next {count} message
            QueueMessage[] retrievedMessage = await queue.ReceiveMessagesAsync(count);

            foreach (QueueMessage msg in retrievedMessage)
            {
                messages.Add(msg.Body.ToString());

                // Delete the message
                await queue.DeleteMessageAsync(msg.MessageId, msg.PopReceipt);
            }

            return messages.ToArray();
        }

        public async ValueTask<bool> QueueAsync(string message)
        {
            try
            {
                var queue = await EnsureQueueClient();
                await queue.SendMessageAsync(message);
                return true;
            }
            catch { }

            return false;
        }

        public async ValueTask<string> UploadToFileShareAsync(
            Stream streamToUpload, 
            string fileShareFolderName, 
            string fileName)
            => await UploadStreamAsync(streamToUpload, fileShareFolderName, fileName);

        public async ValueTask<string> UploadToFileShareAsync(FileInfo fileToUpload, string fileShareFolderName, string fileName)
        {
            using (FileStream stream = fileToUpload.OpenRead())
            {
                return await UploadStreamAsync(stream, fileShareFolderName, fileName);
            }
        }

        private async ValueTask<string> UploadStreamAsync(
            Stream streamToUpload, 
            string fileShareFolderName, 
            string fileName)
        {
            try
            {
                var storageAccountName = "<YOUR AZURE STORAGE ACCOUNT>";
                var fileShareName = "<YOUR AZURE FILE SHARE NAME>";
                var exportDirectory = "<DIRECTORY NAME IN YOUR AZURE FILE SHARE>";
                var azureStorageSecretKey = "<YOUR AZURE STORAGE SECRET KEY>";

                string connexionString = "<YOUR AZURE STORAGE CONNECTION-STRING>";

                CloudFile destinationFile = await AzureStorageHelpers.GetCloudFileAsync(
                    fileShareName!, 
                    fileName, 
                    connexionString, 
                    fileShareFolderName);

                await TransferManager.UploadAsync(streamToUpload, destinationFile);

                return destinationFile.Uri.ToString();
            }
            catch (RequestFailedException azureEx)
            {
                // Log error
                return $"Code: {azureEx.ErrorCode} - {azureEx.Message}";
            }
            catch (TransferException trEx)
            {
                // Log error
                return $"{trEx.ErrorCode} - {trEx.Message}";
            }
            catch (Exception ex)
            {
                // Log error
                return $"{ex.Message}";
            }
        }

        private async ValueTask<QueueClient> EnsureQueueClient()
        {
            string connexionString = "<YOUR AZURE STORAGE CONNECTION-STRING>";
            var queueName = "<YOUR AZURE QUEUE NAME>";

            // Instantiate a QueueClient which will be used to manipulate the queue
            QueueClient queueClient = new QueueClient(connexionString, queueName);

            // Create the queue if it doesn't already exist
            await queueClient.CreateIfNotExistsAsync();

            if (await queueClient.ExistsAsync())
            {
                Console.WriteLine($"Queue '{queueClient.Name}' created");
            }
            else
            {
                Console.WriteLine($"Queue '{queueClient.Name}' exists");
            }

            return queueClient;
        }
    }
}
```

To finalize our **`IAzureStorageService`** we create an **`IServiceCollection`** extension for an easy injection.

```cs
public static class AzureStorageServiceExtensions
{
    public static IServiceCollection AddAzureStorageService(this IServiceCollection service)
    {
        service.AddSingleton<IAzureStorageService, AzureStorageService>();
        return service;
    }
}
```
With this extension we inject our service like this **`builder.Services.AddAzureStorageService()`**.

Next, we implement our **`IHostedService`**.
Remember, our background service, will be responsible to consume data export request from our **Azure Queue**, process the request (execute data extraction from your database, or any other repository). <br />
Let's see how we can implement it.

```cs
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ExportDataSystem
{
    public class SictBackgroundTask : IHostedService, IAsyncDisposable
    {
        private Timer _timer;
        private bool _disposed;

        private readonly IHubContext<ImportExportHub> _exportHub;
        private readonly IAzureStorageService _azureStorageService;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        public SictBackgroundTask(
            IHubContext<ImportExportHub> exportHubContext,
            IAzureStorageService azureStorageService,
            IServiceScopeFactory serviceScopeFactory)
        {
            _timer = default!;
            _exportHub = exportHubContext;
            _azureStorageService = azureStorageService;
            _serviceScopeFactory = serviceScopeFactory;
            _disposed = false;
        }

        public Task StartAsync(System.Threading.CancellationToken cancellationToken)
        {
            // Log starting background task
            _timer = new Timer(async (state) => await ExecuteAsync(state), null, TimeSpan.Zero, TimeSpan.FromSeconds(60));
            return Task.CompletedTask;
        }

        private async ValueTask ExecuteAsync(object? state)
        {
            var scope = _serviceScopeFactory.CreateScope();
            IExportService exportService = scope.ServiceProvider.GetRequiredService<IExportService>();

            // Get request export message from the queue
            var messages = await _azureStorageService.DeQueueAsync();

            foreach (string msg in messages)
            {
                ExportRequest request = JsonConvert.DeserializeObject<ExportRequest>(msg);
              
                // Launch the export process
                // Make a call to your backend service to extract data and upload the exported file to Azure
                var url = exportService.GetAndExportAsync(request);

                ExportResult result = default;
 
                if (!string.IsNullOrEmpty(url) && Uri.TryCreate(url, UriKind.Absolute, out var _))
                {
                    result.UrlToDownladFile = url;
                    result.IsSuccess = true;
                    result.Messages = string.Empty;
                }
                else
                {
                    result.UrlToDownladFile = string.Empty;
                    result.IsSuccess = false;
                    result.Messages = url;  // Url contains the error message
                }

                // Notify the client to download
                await _exportHub.Clients.Client(request.ConnexionId!).SendAsync("exportCompleted", JsonConvert.SerializeObject(result));
            }

            await ((IAsyncDisposable)scope).DisposeAsync().ConfigureAwait(false);
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            // Log background stop
            _timer?.Change(Timeout.Infinite, 0);
            return Task.CompletedTask;
        }

        public async ValueTask DisposeAsync()
        {
            if (!_disposed)
            {
                await _azureLogger.DisposeAsync();
            }
        }
    }
}
```

Let's go deep dive into the code <br />

To implement a **`IHostedService`** interface, we must define theses methods
- **`StartAsync(CancellationToken)`** it's called when the task is started
- **`StopAsync(CancellationToken)`** called before stoping the host server.
<br />

In the **`StartAsync`** we create a **`Timer`** to execute our routinge every 30s (can be changed).
```cs
_timer = new Timer(async (state) => await ExecuteAsync(state), null, TimeSpan.Zero, TimeSpan.FromSeconds(60));
return Task.CompletedTask;
```
<br />

The main method **`ExecuteAsync`** will consume the available messages from our **Azure Queue**
