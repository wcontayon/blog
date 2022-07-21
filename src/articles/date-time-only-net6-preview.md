---
title: "DateOnly and TimeOnly with .NET6 Preview 4"
date: 2021-10-12
year: 2021
layout: article.hbs
blurb: DateOnly and TimeOnly with .NET6 Preview 4
author: 'wcontayon'
tags: general, dotnet
---

The Last .NET preview (.NET 6 preview 4) has introduced two type in the core library DateOnly and TimeOnly.
Thes new types allow us to represent the date or time portion of a DateTime. They are structs (value types) and can be used independently. We can find these type in System namespace.

> **_NOTE:_**  To access these types, you’ll need to download and install .NET 6 preview 4 (or newer) and Visual Studio 16.11 (currently in preview).

### DateOnly

We use **`DateOnly`** type when we need to deal with a date without any time represation. For example, let’s say we need to save the a start date of an employee in our application. In such cases, we rarely need the time portion of a DateTime, and the workaround solution would be to set the time to `00:00:00.000`. With **`DateOnly`**, we are more explicit, and do not worry about any time portion.
To create an instance of **`DateOnly`**, we just need the year, month and day as arguments.

```csharp
var dateOnly = new DateOnly(2020, 01, 01);
```

The code snippet creates a **`DateOnly`** representing the 1st January 2020.
The **`DateOnly`** struct, uses internally an integer to track a day numbery from 0 (1st January 0001) to 3,652, 058 (31st December 9999).
An another usefull feature of **`DateOnly`** is that you can create a **`DateOnly`** instance from a **`DateTime`** like this:

```csharp
var dateOnly = DateOnly.FromDateTime(DateTime.Now);
```

We can achieve more operation like Parse a string and convert to a **`DateOnly`** instance

```csharp
var dateParse = DateOnly.Parse("05/06/2021", CultureInfo.InvariantCulture); 
if (DateOnly.TryParse("05/06/2021", new CultureInfo("en-EN"), DateTimeStyles.None, out var dateOnlyParsed){
...
}
```

We can also, use existing operation of DateTime struct like (**`AddDays`**, **`AddMonths`**, **`AddYears`**)

```csharp
var dateOnly = DateOnly.Parse("05/06/2021", CultureInfo.InvariantCulture); 
var addDayDate = dateOnly.AddDays(1); // 06/06/2021 
var addMonthDate = dateOnly.AddMonths(2); // 05/08/2021 
var addYearDate = dateOnly.AddYears(1); // 05/06/2022
```

You can learn more about **`DateOnly`** struct from the official [dotnet github repository](https://github.com/dotnet/runtime/blob/main/src/libraries/System.Private.CoreLib/src/System/DateOnly.cs)

### TimeOnly

The purpose of **`TimeOnly`** struct is to represent a time that is independent of the date. Let’s think about developing an application when you need to store the time of registration of an user. In such situation, we’ll save the date and the time, but the date is not needed here, because you already have a registration date field. The **`TimeOnly`** is best suited for that.

The **`TimeOnly`** type has several constructor overloads. The more common ones that I expect most developers will use allow us to create a date accepting either the hour and minute for the time, the hour, minute and second, or the hour, minute, second and millisecond.

```csharp
var timeValue = new TimeOnly(10, 30); // 10h30min.
```

The code snippet creates an 24-hour clock format of time 10h30min (10h30 A.M).
The **`TimeOnly`** works with a long representing the number of ticks (100 nanosecond intervals) elapsed since midnight by the defined time.
Ex: 1 AM means 36 000 000 000 ticks since midnight (00:00:00.0000000).

We can create a **`TimeOnly`** instance from ticks with the following constructor public **`TimeOnly(long ticks)`**;

**`TimeOnly`** offers mathematic operations instances, such as sum and calculating the difference.

```csharp
var startTime = new TimeOnly(17, 00, 00);
var endTime = new TimeOnly(19, 00, 00);
var diff = endTime - startTime;
Console.WriteLine($"Hours: {diff.TotalHours}");// Output = Hours: 2
```

Another usefull operation we can perform is to identify whether a particular TimeOnly falls within a time window. For example, let’s say we want to check if the current time is between the start and end times we have already defined. Just as with **`DateOnly`**, we can convert from an existing DateTime into a **`TimeOnly`** using the **`FromDateTime`** static method.

```csharp
var currentTime = TimeOnly.FromDateTime(DateTime.Now);
var isBetween = currentTime.IsBetween(startTime, endTime);
Console.WriteLine($"Current time {(isBetween ? "is" : "is not")} between start and end");
```

The **`IsBetween`** method accepts normal ranges such as the one we used in the prior example as well as ranges that span midnight such as 22:00-02:00.

```csharp
var startTime = new TimeOnly(22, 00);
var endTime = new TimeOnly(02, 00);
var now = new TimeOnly(23, 25); 
var isBetween = now.IsBetween(startTime, endTime);
Console.WriteLine($"Current time {(isBetween ? "is" : "is not")} between start and end"); // Output = Current time is between start and end
```

**`TimeOnly`** also includes operators to compare times using a circular clock.

```csharp
var startTime = new TimeOnly(08, 00);
var endTime = new TimeOnly(09, 00); 
Console.WriteLine($"{startTime < endTime}");// Output = True
```
This code checks if 8h00 am is earlier than 9h00 am, which clearly it is!

You can learn more about **`TimeOnly`** struct type on the official [dotnet github repository](https://github.com/dotnet/runtime/blob/main/src/libraries/System.Private.CoreLib/src/System/TimeOnly.cs).

### Summary

**`DateOnly`** and **`TimeOnly`** offer great features and flexibility to .Net developers.
.NEt 6 preview 4 comes with a lot a new features https://devblogs.microsoft.com/dotnet/announcing-net-6-preview-4/.