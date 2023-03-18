import type { STATE_PARENT, STATE_SIBLINGS } from "./constants";
import type { HState } from ".";

export type StateConfig = {
	actions?: {
		[x: string]: (this: HState, ...args: any[]) => any,
	}
	always?: AlwaysHandlerConfig[],
	conditions?: {
		[x: string]: (this: HState, ...args: any[]) => boolean,
	}
	entry?: EntryHandlerConfig[],
	exit?: ExitHandlerConfig[],
	on?: {
		[x: string]: DispatchHandlerConfig[];
	};
	states?: {
		[x: string]: StateConfig;
	},
	[STATE_SIBLINGS]?: Map<string, HState>
}

export type ResolvedStateConfig = {
	states: Map<string, HState>
}

export type AlwaysHandlerConfig = {
	actions?: string[];
	condition?: string;
	transitionTo?: string;
}

export type DispatchHandlerConfig = {
	actions?: string[];
	condition?: string;
	transitionTo?: string;
}

export type EntryHandlerConfig = {
	actions?: string[];
	condition?: string;
}

export type ExitHandlerConfig = {
	actions?: string[];
	condition?: string;
}

export type ESStateJson = {
	name: string,
	states: {
		[x: string]: ESStateJson,
	},
	transition: {
		active: boolean;
		from: ESStateJson | undefined,
		to: ESStateJson | undefined,
	}
};


