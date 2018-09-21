import { Module } from '@nestjs/common';
import { BullService } from './services/bull/bull.service';
import { BullTaskRegisterService } from './services/bull/bull-task-register.service';
import { FancyLoggerService } from './services/fancy-logger/fancy-logger.service';
import { TaskMetadataExplorer } from './task-metadata-explorer';
import { Controller } from '@nestjs/common/interfaces';
const express = require('express');

@Module({
    providers: [
        BullService,
        BullTaskRegisterService,
        FancyLoggerService,
    ],
    exports: [BullService, BullTaskRegisterService],
})
export class KueModule {}