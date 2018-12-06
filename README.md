# Bull wrapper for NestJS framework

## Description

Bull is a Premium Queue package for handling jobs and messages in NodeJS.
This library provide facilities and utilities to use Bull with NestJS.

## Installation

```bash
npm install --save nestjs-bull
```

## Usage

**Defining tasks:**

Tasks are defined in files like:

```TypeScript
src/modules/users/tasks/users.tasks.ts
```

You can define multiple tasks as a single injectable:

```TypeScript
import { Injectable } from '@nestjs/common';
import Bull = require('bull');
import { Task } from 'nestjs-bull';

@Injectable()
export class UsersTasks {
    @Task({ name: 'justATest', concurrency: 3 })
    justATest(job: Bull.Job, done: Bull.DoneCallback) {
        const result: string = `Job (${job.id}) Ended just fine!`;
        done(null, result);
    }
}
```

**Options when defining a task:**

```TypeScript
@Task({
    name: 'justATest',
    concurrency: 3,
})
```

**Options when defining a Job:**

More option details, see <https://github.com/OptimalBits/bull/blob/master/REFERENCE.md>

```TypeScript
interface JobOptions{
  priority: number; // Optional priority value. ranges from 1 (highest priority) to MAX_INT  (lowest priority). Note that
                    // using priorities has a slight impact on performance, so do not use it if not required.

  delay: number; // An amount of miliseconds to wait until this job can be processed. Note that for accurate delays, both
                 // server and clients should have their clocks synchronized. [optional].

  attempts: number; // The total number of attempts to try the job until it completes.

  repeat: RepeatOpts; // Repeat job according to a cron specification.

  backoff: number | BackoffOpts; // Backoff setting for automatic retries if the job fails

  lifo: boolean; // if true, adds the job to the right of the queue instead of the left (default false)
  timeout: number; // The number of milliseconds after which the job should be fail with a timeout error [optional]

  jobId: number | string; // Override the job ID - by default, the job ID is a unique
                          // integer, but you can use this setting to override it.
                          // If you use this option, it is up to you to ensure the
                          // jobId is unique. If you attempt to add a job with an id that
                          // already exists, it will not be added.

  removeOnComplete: boolean; // If true, removes the job when it successfully
                            // completes. Default behavior is to keep the job in the completed set.

  removeOnFail: boolean; // If true, removes the job when it fails after all attempts.
                         // Default behavior is to keep the job in the failed set.
  stackTraceLimit: number; // Limits the amount of stack trace lines that will be recorded in the stacktrace.
}
```

Firing the task with options:

```TypeScript
@Get('task')
createTask() {
    const opt: Bull.JobOptions = { lifo: true };
     this.bullService.createJob(this.tasks.justATest, { a: 'b' }, opt);
}

**To setup the module, include BullModule and the BullTaskRegisterService in modules where you will use tasks, then register the tasks using the method register():**

```TypeScript

import { ModuleRef } from '@nestjs/core';
import { BullModule, BullTaskRegisterService } from 'nestjs-bull';
import { UsersTasks } from './tasks/users.tasks';

@Module({
  imports: [BullModule],
  controllers: [UsersController],
  providers: [UsersService, UsersTasks],
})
export class UsersModule implements OnModuleInit {
  constructor(
      private readonly moduleRef: ModuleRef,
      private readonly taskRegister: BullTaskRegisterService,
  ) {}
  onModuleInit() {
      this.taskRegister.setModuleRef(this.moduleRef);
      this.taskRegister.register(UsersTasks);
  }
}

```

**Firing a previously defined task:**

Add the BullService and the injectable with the task on your controller

```TypeScript

import { Get, Controller } from '@nestjs/common';
import { UsersTasks } from '../tasks/users.tasks';
import { BullService } from 'nestjs-bull';

@Controller()
export class AppController {
    constructor(
        private readonly bullService: BullService,
        private readonly tasks: UsersTasks
    ) {}
}

```

Firing the task with { a: 'b' } as argument:

```TypeScript

@Get('task')
createTask() {
     this.bullService.createJob(this.tasks.justATest, { a: 'b' })
}

```

**A task can emit some events when created:**

For more information, see <https://github.com/OptimalBits/bull#using-promises>

```TypeScript

@Get('task')
createJob(@Res() res) {
    this.bullService.createJob(this.tasks.justATest, { a: 'b' })
    .then((job) => {
        // When job has successfully be placed in the queue the job is returned
        // then wait for completion
        return job.finished();
    })
    .then((value) => {
        // completed successfully
    })
    .catch((err) => {
        // error
    });
}

```

**Finding a previously created Job:**

```TypeScript

this.bullService.getJob(JOB_ID).then( (job: Bull.Job) => {
    if (job) {
        // tslint:disable-next-line:no-console
        console.log(job);
    }
});

```

For more options and details, please check Bull docs <https://github.com/OptimalBits/bull>

## Debug

**You can enable some debug logs with NESTJS_BULL_DEBUG environment variable:**

```TypeScript

NESTJS_BULL_DEBUG=true

```

## People

- Author - [Erick Phillipe Rezende de Almeida](https://github.com/ephillipe)
- Contributor - [Erick Ponce Leão](https://github.com/erickponce)
