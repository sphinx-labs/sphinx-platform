import {
  Box,
  Spinner,
  Step,
  StepIcon,
  StepIndicator,
  StepNumber,
  Stepper,
  StepSeparator,
  StepStatus,
  StepTitle,
  useSteps,
} from '@chakra-ui/react'
import { MultichainDeploymentStatus } from '@prisma/client'
import { useEffect } from 'react'

type ExtendedStatus = MultichainDeploymentStatus | 'funded'

type Props = {
  status: ExtendedStatus | undefined
}

const fetchStatusIndex = (status: ExtendedStatus | undefined) => {
  switch (status) {
    case 'proposed':
      return 0
    case 'approved':
      return 1
    case 'funded':
      return 2
    case 'executed':
      return 4
    case 'completed':
      return 4
    default:
      return 0
  }
}

export const MultichainDeploymentStatusIndicator: React.FC<Props> = ({
  status,
}) => {
  const steps = [
    { title: 'Approve' },
    { title: 'Fund' },
    { title: 'Execute' },
    { title: 'Done' },
  ]

  const { activeStep, setActiveStep } = useSteps({
    index: fetchStatusIndex(status),
    count: steps.length,
  })

  useEffect(() => {
    setActiveStep(fetchStatusIndex(status))
  }, [status, setActiveStep])

  return (
    <Stepper index={activeStep} width="75%" mr="20">
      {steps.map((step, index) => (
        <Step key={index}>
          <StepIndicator>
            <StepStatus
              complete={<StepIcon />}
              incomplete={<StepNumber />}
              active={<Spinner size="sm" />}
            />
          </StepIndicator>
          <Box flexShrink="0" mx="2">
            <StepTitle>{step.title}</StepTitle>
          </Box>
          <StepSeparator />
        </Step>
      ))}
    </Stepper>
  )
}
