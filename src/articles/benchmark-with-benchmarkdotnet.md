---
title: 'Benchmark your C# Code with Benchmark .NET'
date: 2021-10-20
author: 'wcontayon'
blurb: Measure your dotnet code performance
tags: general, dotnet
---

In this article, we are going to cover how to make your C# code and AspNetCore projects effichient using a benchmark framework BenchmarkDotNet. We’ll set up a benchmarking test in a simple project to compare hashing alogorithms and GRPC and REST.

### What is Benchmark

A benchmark is a set of measurements that concerns the performance of a code, a function, an algorithm or an application. It’s important to benchmark a code, it allows us to understang the performance metrics of the code you write. Consider it as the a good approach to have these metrics at your side, when you’re optimizing or refactoring code.

### What is BenchmarkDotNet

**BenchmarkDotNet** is a hight performance and lightweight .Net library that provides beanchmarking feature to transform and track method/function and provide insights into the performance data captured. It’s an open source project, you read the source on the official github repository. It is easy to write BenchmarkDotNet benchmarks and the results of the benchmarking process are user friendly as well.

We can use BenchmarkDotNet to benchmark both .Net Framework and .Net Core application.
Create a console application project in Visual Studio 2019

Let’s create a .NET Core console application project in Visual Studio. if you do not have Visual Studio, you can download from Microsoft Visual Studio website.
Follow the steps below to create a new .NET Core console application project in Visual Studio.

- Launch the Visual Studio IDE.
- Click on “Create new project.”
- In the “Create new project" window, select “Console App (.NET Core)” from the list of templates displayed.
- Click Next.
- In the “Configure your new project” window shown next, specify the name and location for the new project.
- Click Create.

This will create a new .NET Core console application project in Visual Studio 2019. With a class named Program which have the following code

```csharp
class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("Hello World!");
    }
}
```

### Integrate BenchmarkDotNet in your project

To add BenchmarkDotNet to your project, you can do it from the Nuget Package Manager winfows of Visual Studio for the solution you just created.

<img src="..\assets\articles\img\benchmark1-1536x264.png" width="100%" height="100" />

Or you can use the following command at the NuGet Package Manager Console: **`Install-Package BenchmarkDotNet`**

Edit the code of the Program.cs with the following lines :

```csharp
    public class HashingBenchmark
    {
        private const int N = 10;
        private readonly byte[] data;
        private readonly string sData;

        private readonly SHA256 sha256 = SHA256.Create();

        private readonly MD5 md5 = MD5.Create();

        private readonly PasswordHasher pwdHasher = new PasswordHasher();

        public HashingBenchmark()
        {
            data = new byte[N];
            new Random(42).NextBytes(data);
            sData = UTF8Encoding.UTF8.GetString(data);
        }

        [Benchmark]
        public byte[] Sha256() => sha256.ComputeHash(data);

        [Benchmark]
        public byte[] Md5() => md5.ComputeHash(data);

        [Benchmark]
        public string PwdHasher() => pwdHasher.HashPassword("New Password clear text");

        [Benchmark]
        public string BcryptHash()
        {
            string mySalt = BCrypt.Net.BCrypt.GenerateSalt();
            string myHash = BCrypt.Net.BCrypt.HashPassword("New Password clear text", mySalt);

            return myHash;
        }
    }

    class Program
    {
        static void Main(string[] args)
        {
            var summary = BenchmarkRunner.Run<HashingBenchmark>();
            Console.ReadLine();
        }
    }
```

Let’s explain the code.

We can notice the BenchmarkAttribute on methods **`Sha256()`** **`Md5()`**, **`PwdHaser()`** and **`BcryptHash()`** which is applied only on public method that need to be benchmarked and  the instruction **`BenchmarkRunner.Run<HashingBenchmark>();`** executes the benchmark and logs the result to the console.

The summary of execution looks like
![result-benchmark](..\assets\articles\img\benchmark-result.png)

For each benchmarked method you’ll have a row with the result data. Here I have a 4 lines for my benchmark of **`Sha256()`** **`Md5()`**, **`PwdHaser()`** and **`BcryptHash()`**. You can see their mean execution time measured in nanoseconds, and other statistical data like the error and standard deviation of the timing data across the iterations. From these results, we can notice that the **`Sha256()`** is much faster than others.

Imagine, you want to analyse the memory used during executing your methods. In order to benchmark used memory, we add the **`MemoryDiagnoser()`** attribute on the **`HashingBenchmark`** class. Once the program runs we can notice extra columns have been added to the result.

The first three columns related to GC collections. They are scaled to show the number per 1,000 operations. In this case, the methods would have had to be called very often to trigger a Gen 0 collection and is not likely to cause Gen 1 or Gen 2 collections (except the **BcryptHash()** which does not trigger any Gen collection) The final column is very helpful and it shows the allocated memory per operation.

### Summary

Before start any code optimisation, it’s important to define benchmark baseline. In that way you can see whether the improved code is faster or not, if its allocates less than the previous code, etc. Measurement of the improvements can help to guide further optimisations and also provide crucial data that can justify the time spent making code improvements. Benchmarking with a tool like Benchmark.NET is pretty straightforward for your .Net project.
