---
title: 'Data export system with Azure and SignalR - Part 2'
date: 2022-06-28
year: 2022
publish: draft
draft: true
author: 'wcontayon'
blurb: 'Cloud solution: Data export system with Azure and SignalR'
tags: cloud-architecture, azure, aspnetcore
---



> In order to follow the step, you need to have an **Azure account**. You can create here [Microsoft Azure](https://azure.microsoft.com/).

<br />

### Step 1: Create an Azure storage account with File share and Queue
An **azure storage account** contains all azure storage data objects (Queue, Blobs, Tables, Disks, File shares).
It provides a unique namespace for the Azure Storage data, accessible from anywhere over HTTP and HTTPS.
<br />
To create an Azure account storage with a File Share and a Queue, please follow the links below:

- [Create a storage account](https://docs.microsoft.com/en-us/azure/storage/common/storage-account-create)
- [Create an Azure file share](https://docs.microsoft.com/en-us/azure/storage/files/storage-how-to-create-file-share?tabs=azure-portal)
- [Create an Azure Queue](https://docs.microsoft.com/en-us/azure/storage/common/storage-account-create?toc=/azure/storage/queues/toc.json)

<br />

### Step 2: Create a service to manage our Azure Storage Account

In order to send/read messages from **Azure queue**, upload document to the **Azure file share**, we write a **`IAzureStorageService`** that will be injected to our **`backend API`** and our **`IHostedService`**:


```cs
public class AzureStorageService : IAzureStorageService
    {
        private readonly IOptionsMonitor<AzureOptions> _options;
        private readonly ILogger _azureLogger;

        public AzureStorageService(
            IOptionsMonitor<AzureOptions> options, 
            ILogger azureLogger)
        {
            _options = options;
            _azureLogger = azureLogger;
        }

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

        public async ValueTask<string> UploadToFileShareAsync(
            FileInfo fileToUpload, 
            string fileShareFolderName, 
            string fileName)
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
                var storageAccountName = _options.CurrentValue.AzureStorageAccountName;
                var fileShareName = _options.CurrentValue.FileShareName;
                var exportDirectory = _options.CurrentValue.ExportDirectory;
                var azureStorageSecretKey = _options.CurrentValue.AzureStorageSecretName;

                string connexionString = _options.CurrentValue.ConnexionString;

                CloudFile destinationFile = await AzureStorageHelpers.GetCloudFileAsync(
                    fileShareName!, 
                    fileName, 
                    connexionString, 
                    fileShareFolderName);

                await TransferManager.UploadAsync(streamToUpload, destinationFile);

                await _azureLogger.Log("Data export Ok");

                return destinationFile.Uri.ToString();
            }
            catch (RequestFailedException azureEx)
            {
                await _azureLogger.Error($"{azureEx.ErrorCode} - { azureEx.Message}");
                return $"Code: {azureEx.ErrorCode} - {azureEx.Message}";
            }
            catch (TransferException trEx)
            {
                 await _azureLogger.Error($"{trEx.ErrorCode} - { trEx.Message}");
                return $"{trEx.ErrorCode} - {trEx.Message}";
            }
            catch (Exception ex)
            {
                await _azureLogger.Error($"{ ex.Message}");
                return $"{ex.Message}";
            }
        }

        private async ValueTask<QueueClient> EnsureQueueClient()
        {
            // Get the connection string from app settings
            var azureStorageSecretKey = _options.CurrentValue.AzureStorageSecretName;
            string connexionString = _options.CurrentValue.ConnexionString;
            var queueName = _options.CurrentValue.QueueName;

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
```

To inject into our **`Backend API`** and our **`IHostedService`** we write an extension like below
```cs
 // Extension to inject into IServiceCollection
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

<br />
<br />

### Step 3: Create an IHostedService to process export request

Next, we need to have a routine to process all export messages in our **Azure Queue**. The process will run a SQL query, get the data,


