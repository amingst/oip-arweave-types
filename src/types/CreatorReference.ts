export type CreatorReference =
	| string
	| {
			didAddress: string;
			creatorSig: string;
	  };
