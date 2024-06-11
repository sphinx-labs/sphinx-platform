import { Button } from '@chakra-ui/react'
import { useRouter } from 'next/router'

export const JoinTheWaitlist: React.FC = () => {
  const router = useRouter()

  return (
    <Button
      onClick={() =>
        router.push('https://yk1m5yevl9j.typeform.com/to/m7f5nZuq')
      }
    >
      Request Access
    </Button>
  )
}
