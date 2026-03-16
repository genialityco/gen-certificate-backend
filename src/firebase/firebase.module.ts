import { Module } from '@nestjs/common';
import { firebaseProviders } from './firebase.provider';

@Module({
  providers: firebaseProviders,
  exports: firebaseProviders,
})
export class FirebaseModule {}
