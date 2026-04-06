import { z } from "zod";

type Schedule = z.infer<typeof unstable_scheduleSchema>;
declare function unstable_getSchedulePrompt(event: { date: Date }): string;
declare const unstable_scheduleSchema: z.ZodObject<
  {
    description: z.ZodString;
    when: z.ZodObject<
      {
        cron: z.ZodOptional<z.ZodString>;
        date: z.ZodOptional<z.ZodDate>;
        delayInSeconds: z.ZodOptional<z.ZodNumber>;
        type: z.ZodEnum<["scheduled", "delayed", "cron", "no-schedule"]>;
      },
      "strip",
      z.ZodTypeAny,
      {
        type: "scheduled" | "delayed" | "cron" | "no-schedule";
        cron?: string | undefined;
        delayInSeconds?: number | undefined;
        date?: Date | undefined;
      },
      {
        type: "scheduled" | "delayed" | "cron" | "no-schedule";
        cron?: string | undefined;
        delayInSeconds?: number | undefined;
        date?: Date | undefined;
      }
    >;
  },
  "strip",
  z.ZodTypeAny,
  {
    description: string;
    when: {
      type: "scheduled" | "delayed" | "cron" | "no-schedule";
      cron?: string | undefined;
      delayInSeconds?: number | undefined;
      date?: Date | undefined;
    };
  },
  {
    description: string;
    when: {
      type: "scheduled" | "delayed" | "cron" | "no-schedule";
      cron?: string | undefined;
      delayInSeconds?: number | undefined;
      date?: Date | undefined;
    };
  }
>;

export { type Schedule, unstable_getSchedulePrompt, unstable_scheduleSchema };
