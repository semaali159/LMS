import { NotificationType } from "src/common/enums/notificationType.enum";

export class CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  sourceType: NotificationType;
  sourceId: number;
}
