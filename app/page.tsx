import { Button } from '@/components/ui/button';

export default async function SplashScreen() {
  return (
    <div className='min-h-screen flex flex-col bg-gradient-to-b p-4'>
      <div className='w-full max-w-md flex flex-col items-center justify-between flex-grow'>
        <h1 className='text-4xl font-bold mb-4 text-center'>Bill Split</h1>
        <p className='text-xl text-white mb-8 text-center'>
          Split bills easily with friends and family
        </p>
      </div>
      <div className='w-full max-w-md mt-auto'>
        <div className='space-y-4 w-full'>
          <Button variant='light' className='w-full'>
            Click here
          </Button>
          <Button variant='primary' className='w-full'>
            Click here
          </Button>
          <Button variant='gray' className='w-full'>
            Login With Google
          </Button>
        </div>
      </div>
    </div>
  );
}
