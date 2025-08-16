type FieldDefinitionEnumData = {
	enumValues: string[];
};

type FieldDefinition = {
	type: string;
	index: number;
} & Partial<FieldDefinitionEnumData>;

type TemplateData = {
	template: string;
	fieldsInTemplate: Record<string, FieldDefinition>;
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

// Data reference type - can be a DID string or resolved record
type DataReference<T = unknown> = string | T;

// For when we know it's just the DID string (not resolved)
type DID = string;

// For resolved records at various depths
type ResolvedRecord<T = unknown> = T;
