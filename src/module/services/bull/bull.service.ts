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

    constructor(
        private readonly fancyLogger: FancyLoggerService
    ) {
        this.queues[BullService.DEFAULT_QUEUE_NAME] = this.createQueue(BullService.DEFAULT_QUEUE_NAME);        
    }

    registerTask(task: (job, done) => void, metadata: TaskMetadata, ctrl: Controller) {
        let queueName: string = metadata.queue || BullService.DEFAULT_QUEUE_NAME;
        let concurrency: number = metadata.concurrency || BullService.DEFAULT_CONCURRENCY;
        if (!this.queues[queueName]) {
            this.queues[queueName] = this.createQueue(queueName, metadata.options);
        }
        this.queues[queueName].process(metadata.name, concurrency, async (j, d) => {
            return Promise.resolve(task.call(ctrl, j, d));
        });
        this.tasks[metadata.name] = metadata;
    }

    private createQueue(queueName: string, queueOptions? : Bull.QueueOptions): Bull.Queue {
        let queue: Bull.Queue = new Bull(queueName, queueOptions);
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

    private getQueue(name: string): Bull.Queue {
        let queueName: string = name || BullService.DEFAULT_QUEUE_NAME;
        let queue: Bull.Queue = this.queues[queueName];
        return queue;
    }

    createJob(task, data: Object, opts?: Bull.JobOptions): Bluebird<Bull.Job<any>> {
        let metadata: TaskMetadata = this.tasks[task.name];
        let queue: Bull.Queue = this.getQueue(metadata.queue);

        return queue.add(metadata.name, data, opts);
    }

    getJob(jobId: Bull.JobId, queueName?: string): Promise<Bull.Job> {
      return new Promise((resolve, reject) => {
            let queue: Bull.Queue = this.getQueue(queueName);
            queue.getJob(jobId).then( (job?: Bull.Job) => {              
                return resolve(job);
            });
        });
    }
}
