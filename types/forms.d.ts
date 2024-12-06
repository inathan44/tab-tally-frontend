import { useForm } from 'react-hook-form';
import { CreateGroupSchema } from '@/app/schemas/createGroup';

// Define the type for the useForm return value
export type CreateGroupForm = ReturnType<typeof useForm<CreateGroupSchema>>;
