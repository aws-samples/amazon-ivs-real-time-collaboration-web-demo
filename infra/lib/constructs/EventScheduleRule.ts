import { createResourceName } from '@Lib/utils';
import {
  aws_events as events,
  aws_events_targets as targets,
  aws_lambda as lambda,
  aws_stepfunctions as stepFn,
  aws_stepfunctions_tasks as stepFnTasks,
  Duration
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import cron from 'cron-parser';

interface CronSchedule extends events.CronOptions {
  /**
   * The second at which to run the CRON job
   * @default - "0"; run at the first second of every minute
   */
  second?: string;
}

interface EventScheduleRuleProps extends events.RuleProps {
  cronSchedule: CronSchedule;
  lambdaFunction: lambda.Function;
}

class EventScheduleRule extends events.Rule {
  constructor(scope: Construct, id: string, props: EventScheduleRuleProps) {
    const {
      cronSchedule: { second, ...restCronSchedule },
      lambdaFunction,
      ...ruleProps
    } = props;

    super(scope, id, {
      schedule: events.Schedule.cron(restCronSchedule),
      ...ruleProps
    });

    const secondOfCronSchedule = second == null ? '0' : second;
    if (secondOfCronSchedule === '0') {
      // Schedule is not sub-minute, so there is no need for a StepFunctions State Machine; a simple event schedule will suffice
      this.addTarget(new targets.LambdaFunction(lambdaFunction));

      return;
    }

    const wait = new stepFn.Wait(this.stack, `${id}-Wait-State`, {
      time: stepFn.WaitTime.secondsPath('$')
    });
    const invoke = new stepFnTasks.LambdaInvoke(
      this.stack,
      `${id}-LambdaInvoke-Task`,
      { lambdaFunction, payload: stepFn.TaskInput.fromObject({}) }
    );
    const waitThenInvoke = new stepFn.Choice(
      this.stack,
      `${id}-WaitThenInvoke-Choice`
    )
      .when(stepFn.Condition.numberGreaterThan('$', 0), wait.next(invoke))
      .otherwise(invoke);

    const secs: number[] = [];
    const parsedCronSchedule = cron.parseExpression(
      `${secondOfCronSchedule} * * * * *`
    );
    parsedCronSchedule.fields.second.forEach((s) => {
      if (secs.length === 0 || s !== secs[secs.length - 1]) secs.push(s);
    });

    const createLoopItems = new stepFn.Pass(
      this.stack,
      `${id}-LoopItems-PassState`,
      {
        result: stepFn.Result.fromArray(
          secs.map((s, i) => (i === 0 ? s : s - secs[i - 1]))
        )
      }
    );
    const loop = new stepFn.Map(this.stack, `${id}-Loop-MapState`, {
      maxConcurrency: 1
    }).itemProcessor(waitThenInvoke);
    const loopChain = createLoopItems.next(loop);

    const stateMachine = new stepFn.StateMachine(
      this.stack,
      `${id}-StateMachine`,
      {
        definitionBody: stepFn.DefinitionBody.fromChainable(loopChain),
        stateMachineName: `${createResourceName(this.stack, id)}-StateMachine`,
        stateMachineType: stepFn.StateMachineType.EXPRESS,
        timeout: Duration.seconds(90)
      }
    );

    this.addTarget(new targets.SfnStateMachine(stateMachine));
  }
}

export default EventScheduleRule;
