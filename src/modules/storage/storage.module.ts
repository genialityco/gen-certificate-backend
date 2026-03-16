import { Module } from '@nestjs/common';
import { FirebaseModule } from '../../firebase';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [FirebaseModule],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
