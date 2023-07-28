import {
  ActionArguments,
  ActionFlags,
  Actions,
  BaseSource,
  Item,
} from "https://deno.land/x/ddu_vim@v3.4.4/types.ts";
import { GatherArguments } from "https://deno.land/x/ddu_vim@v3.4.4/base/source.ts";
import { ActionData } from "https://deno.land/x/ddu_kind_file@v0.5.3/file.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.4.0/mod.ts";

type Params = {
  kind: string;
};

export class Source extends BaseSource<Params> {
  override kind = "file";

  override gather(
    args: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const result = ensure(
          await args.denops.call(`mr#${args.sourceParams.kind}#list`),
          is.ArrayOf(is.String),
        ).map((path) => ({
          word: path,
          action: { path },
        }));
        controller.enqueue(result);
        controller.close();
      },
    });
  }

  override actions: Actions<Params> = {
    async delete(args: ActionArguments<Params>) {
      for (const item of args.items) {
        await args.denops.call(
          `mr#${args.sourceParams.kind}#delete`,
          ensure(item.action, is.ObjectOf({ path: is.String })).path,
        );
      }
      return ActionFlags.RefreshItems;
    },
  };

  override params(): Params {
    return {
      kind: "mru",
    };
  }
}
