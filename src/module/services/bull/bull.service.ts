import { Injectable } from '@nestjs/common';
import { TaskMetadata } from '../../utils/task.decorator';
import { FancyLoggerService } from '../fancy-logger/fancy-logger.service';
import { Controller } from "@nestjs/common/interfaces";
import Bull = require("bull");
import * as Bluebird from "bluebird";


@Injectable()
export class BullService {
    private static readonly DEFAULT_CONCURRENCY: number = 3;
    private static readonly DEFAULT_QUEUE_NAME: string = 'default';
    private static readonly DEBUG_EVENTS: Array<string> = [
        'job enqueue',
        'job complete',
        'job failed attempt',
        'job failed',
    ];

    private queues: { [name: string]: Bull.Queue } = {};
    private tasks: { [name: string]: TaskMetadata } = {};
    private debugActive: boolean = false;
    private redisConfig = {
        prefix: process.env.KUE_REDIS_PREFIX,
    };

    constructor(
        private readonly fancyLogger: FancyLoggerService
    ) {
        // if (process.env.KUE_REDIS_URI) {
        //     this.redisConfig = {
        //         ...this.redisConfig, redis: process.env.KUE_REDIS_URI,
        //     };
        // } else {
        //     this.redisConfig = {
        //         ...this.redisConfig, redis: {
        //             port: process.env.KUE_REDIS_PORT,
        //             host: process.env.KUE_REDIS_HOST,
        //             db: process.env.KUE_REDIS_DB,
        //         },
        //     };
        // }

        this.queues[BullService.DEFAULT_QUEUE_NAME] = this.createQueue(BullService.DEFAULT_QUEUE_NAME);        
    }

    registerTask(task: (job, done) => void, metadata: TaskMetadata, ctrl: Controller) {
        let queueName: string = metadata.queue || BullService.DEFAULT_QUEUE_NAME;
        let concurrency: number = metadata.concurrency || BullService.DEFAULT_CONCURRENCY;
        if (!this.queues[queueName]) {
            this.queues[queueName] = this.createQueue(queueName);
        }
        this.queues[queueName].process(metadata.name, concurrency, async (j, d) => {
            return Promise.resolve(task.call(ctrl, j, d));
        });
        this.tasks[metadata.name] = metadata;
    }

    private createQueue(queueName: string): Bull.Queue {
        let queue: Bull.Queue = new Bull(queueName, this.redisConfig);

        if (!this.debugActive && 
            process.env.NESTJS_BULL_DEBUG && 
            queueName == BullService.DEFAULT_QUEUE_NAME) {
            this.debugActive = true;
            this.bindDebugQueueEvents(queue);
        }

        return queue;
    }

    private bindDebugQueueEvents(queue: Bull.Queue) {
        for (let event of BullService.DEBUG_EVENTS) {
            queue.on(event, (job: Bull.Job) => {                
                if (job) this.debugLog(job, event);
            });
        }

        queue.on('error', (err: Error) => {
           if (err) this.debugLog(undefined, 'job error', err);
        });
    }

    private debugLog(job: Bull.Job, event: string, err?) {
        let log: string = `Task ${job} ${event} `;
        log += `${(err) ? '\n' + FancyLoggerService.clc.red(err) : ''}`;
        this.fancyLogger.info('KueModule', log, 'TaskRunner');
    }

    createJob(task, data: Object, opts?: Bull.JobOptions): Bluebird<Bull.Job<any>> {
        let metadata: TaskMetadata = this.tasks[task.name];
        let queueName: string = metadata.queue || BullService.DEFAULT_QUEUE_NAME;
        let queue: Bull.Queue = this.queues[queueName];

        return queue.add(metadata.name, data, opts);
    }
        
    // getJob(id: string): Promise<kue.Job> {
    //   return new Promise((resolve, reject) => {
    //       kue.Job.get(id, (err, job: kue.Job) => {
    //           if (err) {
    //               return reject(err);
    //           }
    //           return resolve(job);
    //       });
    //   });
    // }
}
