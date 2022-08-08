import { User } from '../../models/User'
import { getJourneyEntrance, getJourneyStep, lastJourneyStep } from './JourneyRepository'
import { JourneyEntrance, JourneyDelay, JourneyGate, JourneyStep } from './JourneyStep'

export default class JourneyService {

    journeyId: number
    constructor(journeyId: number) {
        this.journeyId = journeyId
    }

    async run(user: User, event?: Event) {

        // Loop through all possible next steps until we get an empty next
        // which signifies that the journey is in a pending state

        let nextStep: JourneyStep | undefined | null = await this.nextStep(user)
        while (nextStep) {
            const parsedStep = this.parse(nextStep)

            // If completed, jump to next otherwise validate condition
            if (await parsedStep.hasCompleted(user)) {
                nextStep = await parsedStep.next(user)
            } else if (await parsedStep.condition(user, event)) {
                await parsedStep.complete(user)
                nextStep = await parsedStep.next(user)
            } else {
                nextStep = null
            }
        }
    }

    parse(step: JourneyStep): JourneyStep {
        const options = {
            [JourneyEntrance.name]: JourneyEntrance,
            [JourneyDelay.name]: JourneyDelay,
            [JourneyGate.name]: JourneyGate,
        }
        return options[step.type].fromJson(step)
    }

    async nextStep(user: User): Promise<JourneyStep | undefined> {

        // Get the ID of last step the user has started previously
        const lastUserStep = await lastJourneyStep(user.id, this.journeyId)

        // The user hasn't started journey yet, check the entrance
        if (!lastUserStep) {
            return await getJourneyEntrance(this.journeyId)
        }

        // Get the data for the journey step
        return await getJourneyStep(lastUserStep.step_id)
    }
}
