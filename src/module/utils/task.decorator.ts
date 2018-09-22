import 'reflect-metadata';
import { TASK_METADATA, TASK_CONFIGURATION_METADATA } from '../constants';
import Bull = require("bull");

export interface TaskMetadata {
    name: string;
    queue?: string;
    concurrency?: number;
    options: Bull.QueueOptions;
}

export const Task = (metadata?: TaskMetadata | string): MethodDecorator => {
    return (target, key, descriptor: PropertyDescriptor) => {
        Reflect.defineMetadata(TASK_CONFIGURATION_METADATA, metadata, descriptor.value);
        Reflect.defineMetadata(TASK_METADATA, true, descriptor.value);
        return descriptor;
    };
};