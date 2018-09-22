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
    attempts: 3,
    ttl: 3000,
    backoff: { delay: 5 * 1000, type: 'fixed' }
})
```

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

```node
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

For more options and details, please check Bull docs <https://github.com/OptimalBits/bull>

## Debug

**You can enable some debug logs with NESTJS_BULL_DEBUG environment variable:**

```TypeScript
NESTJS_BULL_DEBUG=true
```

## People

- Author - [Erick Phillipe Rezende de Almeida](https://github.com/ephillipe)
- Contributor - [Erick Ponce Leão](https://github.com/erickponce)
