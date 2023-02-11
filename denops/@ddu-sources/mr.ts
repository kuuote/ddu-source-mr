import { relative } from "https://deno.land/std@0.177.0/path/mod.ts";
import { ActionData } from "https://deno.land/x/ddu_kind_file@v0.3.2/file.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v2.2.0/deps.ts";
import {
  ActionArguments,
  ActionFlags,
  BaseSource,
  Item,
} from "https://deno.land/x/ddu_vim@v2.2.0/types.ts";
import {
  assertArray,
  isString,
} from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";

const kinds = ["mrr", "mrw", "mru"];

type Params = {
  kind: string;
  current: boolean;
};

export class Source extends BaseSource<Params> {
  kind = "file";

  actions = {
    async mr_delete(args: ActionArguments<Params>) {
      const fn = `mr#${args.sourceParams.kind}#delete`;
      for (const item of args.items) {
        const data = item.action as ActionData;
        await args.denops.call(fn, data.path);
      }
      return ActionFlags.RefreshItems;
    },
  };

  gather(args: {
    denops: Denops;
    sourceParams: Params;
  }): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const dir = await fn.getcwd(args.denops) as string;
        const idx = kinds.indexOf(args.sourceParams.kind);
        const result = args.sourceParams.current
          ? await args.denops.call(
            "mr#filter",
            await args.denops.call(`mr#${kinds.at(idx)}#list`),
            `${dir}`,
          )
          : await args.denops.call(`mr#${kinds.at(idx)}#list`);
        assertArray(result, isString);
        controller.enqueue(result.map((p) => ({
          word: args.sourceParams.current ? relative(dir, p) : p,
          action: {
            path: p,
          },
        })));
        controller.close();
      },
    });
  }

  params(): Params {
    return {
      kind: "mru",
      current: false,
    };
  }
}
