import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v3.0.0/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v3.0.0/deps.ts";
import { ActionData } from "https://deno.land/x/ddu_kind_file@v0.5.0/file.ts";
import {
  assertArray,
  isString,
} from "https://deno.land/x/unknownutil@v2.1.1/mod.ts";
import { relative } from "https://deno.land/std@0.191.0/path/mod.ts";

const kinds = ["mrr", "mrw", "mru"];

type Params = {
  kind: string;
  current: boolean;
};

export class Source extends BaseSource<Params> {
  kind = "file";

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
