type FieldDefinition = {
	type: string;
	index: number;
	required?: boolean;
};

type TemplateData = {
	template: string;
	fieldsInTemplate: Record<string, FieldDefinition>;
	// Dynamic property for x_typeValues fields
	[key: string]: any;
};

type TemplateOipData = {
	didTx: string;
	inArweaveBlock: number;
	indexedAt: string;
	recordStatus: string;
	ver: string;
	creator: {
		didAddress: string;
		creatorSig: string;
	};
};

type ApiResponse = {
	templates: Array<{
		data: TemplateData;
		oip: TemplateOipData;
	}>;
};

type CreatorReference =
	| string
	| {
			didAddress: string;
			creatorSig: string;
	  };
