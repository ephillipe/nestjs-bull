IN DEVELOPMENT YET

## Bull wrapper for NestJS framework

## Description

<p>Bull is a Premium Queue package for handling jobs and messages in NodeJS.</p> 
<p>This library provide facilities and utilities to use Bull with NestJS.</p>


## Installation

```bash
$ npm install --save nestjs-bull
```

## Usage

**Defining tasks:**

<p>Tasks are defined in files like:<p/>

```
src/modules/users/tasks/users.tasks.ts
```

<p>You can define multiple tasks as a single injectable:</p>

```node
import { Injectable } from '@nestjs/common';
import { Job, JobCallback, DoneCallback } from 'kue';
import { Task } from 'nestjs-bull';

@Injectable()
export class UsersTasks {
    @Task({ name: 'justATest' })
    justATest(job: Job, done: DoneCallback) {
        const result: string = 'Ended just fine!';
        done(null, result);
    }
}
``` 

**Options when defining a task:**
```node
@Task({
    name: 'justATest',
    concurrency: 3,
    attempts: 3,
    ttl: 3000,
    backoff: { delay: 5 * 1000, type: 'fixed' }
})
```

**To setup the module, include KueModule and the KueTaskRegisterService in modules where you will use tasks, then register the tasks using the method register():**

```node
import { ModuleRef } from '@nestjs/core';
import { KueModule, KueTaskRegisterService } from 'nestjs-kue';
import { UsersTasks } from './tasks/users.tasks';

@Module({
  imports: [KueModule],
  controllers: [UsersController],
  providers: [UsersTasks],
})
export class UsersModule implements OnModuleInit {
    constructor(
        private readonly moduleRef: ModuleRef,
        private readonly taskRegister: KueTaskRegisterService
    ) {}

    onModuleInit() {
        this.taskRegister.setModuleRef(this.moduleRef);
        this.taskRegister.register(UsersTasks);
    }
}
```

**Firing a previously defined task:**
<p>Add the KueServive and the injectable with the task on your controller</p>

```node
import { Get, Controller } from '@nestjs/common';
import { UsersTasks } from './tasks/users.tasks';
import { KueService } from 'nestjs-kue';

@Controller()
export class AppController {
    constructor(
        private readonly kueService: KueService,
        private readonly tasks: UsersTasks
    ) {}
}
``` 

<p>Firing the task with { a: 'b' } as argument:</p>

```node
@Get('task')
createTask() {
    const job = this.kueService.createJob(this.tasks.justATest, { a: 'b' }).save();
}
```

**A task can emit some events when fired:**
<p>https://github.com/Automattic/kue#job-events</p>

```node
@Get('task')
createJob(@Res() res) {
    const job = this.kueService.createJob(this.tasks.justATest, { a: 'b' }).save();
    job.on('complete', (result) => res.send(result));
    job.on('failed', (err) => res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err));
}
```

**For more options and details, please check Kue docs**
<p><a href="https://github.com/Automattic/kue" target="blank">Kue</a></p>

## Debug
**You can enable some debug logs with NESTJS_BULL_DEBUG environment variable:**

```node
NESTJS_BULL_DEBUG=true
```

## People

- Author - [Erick Phillipe Rezende de Almeida](https://github.com/ephillipe)
- Contributor - [Erick Ponce Leão](https://github.com/erickponce)
