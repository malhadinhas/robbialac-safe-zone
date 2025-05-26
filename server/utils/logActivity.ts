import { UserActivity } from '../models/UserActivity';
import { checkActionBasedMedals } from '../controllers/medalController';

export async function logActivity({
  userId,
  category,
  action,
  details
}: {
  userId: string;
  category: string;
  action: string;
  details?: Record<string, any>;
}) {
  const activity = new UserActivity({
    userId,
    category,
    action,
    details,
    timestamp: new Date()
  });

  await activity.save();
  await checkActionBasedMedals(userId);
}
