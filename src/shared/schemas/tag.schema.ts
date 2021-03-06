import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'tags' })
export class TagDocument extends Document {
  @Prop()
  name: string;

  @Prop()
  tagged: number;

  @Prop()
  uri: string;

  @Prop()
  id: number;

  @Prop()
  category: string;
}

export const TagSchema = SchemaFactory.createForClass(TagDocument);
