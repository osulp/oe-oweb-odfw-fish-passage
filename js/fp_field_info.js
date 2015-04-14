var fp_field_info = [{
    "name": "OBJECTID",
    "type": "esriFieldTypeOID",
    "alias": "OBJECTID",
    "sqlType": "sqlTypeOther",
    "nullable": false,
    "editable": false,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbFtrID",
    "type": "esriFieldTypeInteger",
    "alias": "Barrier ID",
    "sqlType": "sqlTypeOther",
    "nullable": false,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbLong",
    "type": "esriFieldTypeDouble",
    "alias": "Longitude",
    "sqlType": "sqlTypeOther",
    "nullable": false,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbLat",
    "type": "esriFieldTypeDouble",
    "alias": "Latitude",
    "sqlType": "sqlTypeOther",
    "nullable": false,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbRevDt",
    "type": "esriFieldTypeString",
    "alias": "Entry or Revision Date",
    "sqlType": "sqlTypeOther", "length": 8,
    "nullable": true,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbONm",
    "type": "esriFieldTypeString",
    "alias": "Originator Name",
    "sqlType": "sqlTypeOther", "length": 30,
    "nullable": false,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbLocMd",
    "type": "esriFieldTypeString",
    "alias": "Location Method",
    "sqlType": "sqlTypeOther", "length": 15,
    "nullable": false,
    "editable": true,
    "domain":
{
    "type": "codedValue",
    "name": "LocationCollectionMethod",
    "codedValues": [
{
    "name": "Field - GPS",
    "code": "FieldGPS"
},
{
    "name": "Field - Record location on 7.5' quad map",
    "code": "FieldQuad"
},
{
    "name": "Field - Other",
    "code": "FieldOther"
},
{
    "name": "Digitally derived (e.g. located on-screen using DOQ or DRG)",
    "code": "DigDerive"
},
{
    "name": "External Inventory (e.g. National Inventory of Dams, GNIS)",
    "code": "ExtInv"
},
{
    "name": "Located on map via professional judgement (first-hand knowledge of feature location)",
    "code": "ProfJudge"
},
{
    "name": "Other",
    "code": "Other"
},
{
    "name": "Unknown",
    "code": "Unknown"
}
    ]
},
    "defaultValue": null
},
{
    "name": "fpbLocAccu",
    "type": "esriFieldTypeSmallInteger",
    "alias": "Location Accuracy",
    "sqlType": "sqlTypeOther",
    "nullable": false,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbLocDt",
    "type": "esriFieldTypeString",
    "alias": "Location Date",
    "sqlType": "sqlTypeOther", "length": 8,
    "nullable": true,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbFtrTy",
    "type": "esriFieldTypeString",
    "alias": "Feature Type",
    "sqlType": "sqlTypeOther", "length": 25,
    "nullable": false,
    "editable": true,
    "domain":
{
    "type": "codedValue",
    "name": "FeatureType",
    "codedValues": [
{
    "name": "Dam",
    "code": "Dam"
},
{
    "name": "Culvert - road stream crossing",
    "code": "Culvert"
},
{
    "name": "Weir / sill",
    "code": "WeirSill"
},
{
    "name": "Natural waterfalls",
    "code": "Falls"
},
{
    "name": "Cascades / gradient / velocity (incl. debris torrented reaches)",
    "code": "CascadeGradientVelocity"
},
{
    "name": "Bridge - road stream crossing",
    "code": "Bridge"
},
{
    "name": "Ford - road stream crossing",
    "code": "Ford"
},
{
    "name": "Tide gate - see business rule for assigning subtypes",
    "code": "TideGate"
},
{
    "name": "Other known fish passage barrier feature including debris jams",
    "code": "Other"
},
{
    "name": "Unknown",
    "code": "Unknown"
}
    ]
},
    "defaultValue": null
},
{
    "name": "fpbFtrNm",
    "type": "esriFieldTypeString",
    "alias": "Feature Name",
    "sqlType": "sqlTypeOther", "length": 50,
    "nullable": false,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbMltFtr",
    "type": "esriFieldTypeString",
    "alias": "Multiple Feature Flag",
    "sqlType": "sqlTypeOther", "length": 7,
    "nullable": false,
    "editable": true,
    "domain":
{
    "type": "codedValue",
    "name": "MultipleFeature",
    "codedValues": [
{
    "name": "multiple features at road - stream xing",
    "code": "yes"
},
{
    "name": "single feature",
    "code": "no"
},
{
    "name": "Number of features unknown",
    "code": "unknown"
}
    ]
},
    "defaultValue": null
},
{
    "name": "fpbFPasSta",
    "type": "esriFieldTypeString",
    "alias": "Passage Status",
    "sqlType": "sqlTypeOther", "length": 8,
    "nullable": false,
    "editable": true,
    "domain":
{
    "type": "codedValue",
    "name": "PassageStatus",
    "codedValues": [
{
    "name": "Not passable",
    "code": "Blocked"
},
{
    "name": "Partially passable - a barrier to at least some fish at some time",
    "code": "Partial"
},
{
    "name": "Completely passable",
    "code": "Passable"
},
{
    "name": "Unknown",
    "code": "Unknown"
},
{
    "name": "Unknown passage, within the range of anadromy",
    "code": "UnkAnad"
}
    ]
},
    "defaultValue": null
},
{
    "name": "fpbStaEvDt",
    "type": "esriFieldTypeString",
    "alias": "Passage Status Evaluation Date",
    "sqlType": "sqlTypeOther", "length": 8,
    "nullable": true,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbStaEvMd",
    "type": "esriFieldTypeString",
    "alias": "Passage Status Evaluation Method",
    "sqlType": "sqlTypeOther", "length": 20,
    "nullable": false,
    "editable": true,
    "domain":
{
    "type": "codedValue",
    "name": "StatusEvalMethod",
    "codedValues": [
{
    "name": "USFS / BLM full passage assessment",
    "code": "USFSBLMFullAssess"
},
{
    "name": "Other full passage assessment",
    "code": "OtherFullAssess"
},
{
    "name": "USFS / BLM partial passage assessment (coarse screen filter)",
    "code": "USFSBLMPartialAssess"
},
{
    "name": "Other partial passage assessment (incl. professional judgement)",
    "code": "OtherPartialAssess"
},
{
    "name": "By evaluation of design plans",
    "code": "ByDesign"
},
{
    "name": "Unknown",
    "code": "Unknown"
},
{
    "name": "Not applicable",
    "code": "NA"
}
    ]
},
    "defaultValue": null
},
{
    "name": "fpbFySta",
    "type": "esriFieldTypeString",
    "alias": "Fishway Status",
    "sqlType": "sqlTypeOther", "length": 20,
    "nullable": false,
    "editable": true,
    "domain":
{
    "type": "codedValue",
    "name": "FishwayStatus",
    "codedValues": [
{
    "name": "Functioning – does not meet current criteria",
    "code": "FuncNonCrit"
},
{
    "name": "Needs repair or maintenance and does not meet current state or NMFS fish passage criteria",
    "code": "NeedsMaintNonCrit"
},
{
    "name": "Abandoned fishway - no longer needed (e.g. fishway at natural falls)",
    "code": "Abandoned"
},
{
    "name": "No fishway",
    "code": "None"
},
{
    "name": "No fishway – mitigation provided",
    "code": "NoneMitigation"
},
{
    "name": "No fishway – negligible current benefit",
    "code": "NoneExempt"
},
{
    "name": "Fishway not wanted – conflicts with other native fish management needs",
    "code": "NoneConflict"
},
{
    "name": "Unknown",
    "code": "Unknown"
},
{
    "name": "Functioning, passes fish",
    "code": "FuncOkay"
},
{
    "name": "Not properly functioning, needs repair or maintenance",
    "code": "NeedsMaint"
}
    ]
},
    "defaultValue": null
},
{
    "name": "fpbStrNm",
    "type": "esriFieldTypeString",
    "alias": "Stream Name",
    "sqlType": "sqlTypeOther", "length": 50,
    "nullable": true,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbRdNm",
    "type": "esriFieldTypeString",
    "alias": "Road Name",
    "sqlType": "sqlTypeOther", "length": 50,
    "nullable": true,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbFtrSTy",
    "type": "esriFieldTypeString",
    "alias": "Barrier Subtype",
    "sqlType": "sqlTypeOther", "length": 30,
    "nullable": true,
    "editable": true,
    "domain":
{
    "type": "codedValue",
    "name": "FeatureSubtype",
    "codedValues": [
{
    "name": "Dam - permanent throughout the year",
    "code": "DamPermanent"
},
{
    "name": "Dam - in place for only part of the year",
    "code": "DamSeasonal"
},
{
    "name": "Culvert - open arch",
    "code": "OpenArch"
},
{
    "name": "Culvert - open box",
    "code": "OpenBox"
},
{
    "name": "Culvert - round",
    "code": "Round"
},
{
    "name": "Culvert - pipe arch",
    "code": "PipeArch"
},
{
    "name": "Culvert - full box",
    "code": "FullBox"
},
{
    "name": "Tide Gate - Side-hinged orientation, aluminum material, not mechanically controlled",
    "code": "SideHingedAluminum"
},
{
    "name": "Tide Gate - Top-hinged orientation, iron or steel material, not mechanically controlled",
    "code": "TopHingedIronSteel"
},
{
    "name": "Tide Gate - Top-hinged orientation, wood material, not mechanically controlled",
    "code": "TopHingedWood"
},
{
    "name": "Tide Gate - Mechanically controlled",
    "code": "MechanicallyControlled"
},
{
    "name": "Ford - Concrete",
    "code": "Concrete"
},
{
    "name": "Ford - Asphalt",
    "code": "Asphalt"
},
{
    "name": "Ford - On-site, native material",
    "code": "NativeMaterial"
},
{
    "name": "Ford - Off-site rock",
    "code": "OffsiteRock"
},
{
    "name": "Other known subtype",
    "code": "Other"
},
{
    "name": "Unknown subtype",
    "code": "Unknown"
}
    ]
},
    "defaultValue": null
},
{
    "name": "fpbHeight",
    "type": "esriFieldTypeSingle",
    "alias": "Height (ft)",
    "sqlType": "sqlTypeOther",
    "nullable": true,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbLength",
    "type": "esriFieldTypeSingle",
    "alias": "Length(ft)",
    "sqlType": "sqlTypeOther",
    "nullable": true,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbWidth",
    "type": "esriFieldTypeSingle",
    "alias": "Width(ft)",
    "sqlType": "sqlTypeOther",
    "nullable": true,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbSlope",
    "type": "esriFieldTypeSingle",
    "alias": "Slope(%)",
    "sqlType": "sqlTypeOther",
    "nullable": true,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbDrop",
    "type": "esriFieldTypeSingle",
    "alias": "Drop(ft)",
    "sqlType": "sqlTypeOther",
    "nullable": true,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbOrYr",
    "type": "esriFieldTypeString",
    "alias": "Origin Year",
    "sqlType": "sqlTypeOther", "length": 4,
    "nullable": true,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbOwn",
    "type": "esriFieldTypeString",
    "alias": "Owner",
    "sqlType": "sqlTypeOther", "length": 60,
    "nullable": true,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "fpbFyTy",
    "type": "esriFieldTypeString",
    "alias": "Fishway Type",
    "sqlType": "sqlTypeOther", "length": 15,
    "nullable": true,
    "editable": true,
    "domain":
{
    "type": "codedValue",
    "name": "FishwayType",
    "codedValues": [
{
    "name": "Pool style fishways have a series of distinct pools in which the energy of the flow entering each one is entirely dissipated prior to flowing to the next.",
    "code": "Pool"
},
{
    "name": "Chutes or flumes with roughness, designed to reduce velocity, allowing fish passage.",
    "code": "BaffledChute"
},
{
    "name": "Combination of multiple fishway types.",
    "code": "Hybrid"
},
{
    "name": "A fishway that crosses the entire stream channel.",
    "code": "FullSpanning"
},
{
    "name": "Structures that direct the stream flow to attract upstream migrants into holding (impoundment) areas.",
    "code": "Trap"
},
{
    "name": "Other known fishway type",
    "code": "Other"
},
{
    "name": "Unknown fishway type",
    "code": "Unknown"
}
    ]
},
    "defaultValue": null
},
{
    "name": "fpbComment",
    "type": "esriFieldTypeString",
    "alias": "Comment",
    "sqlType": "sqlTypeOther", "length": 254,
    "nullable": true,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "OWEB_Update",
    "type": "esriFieldTypeSmallInteger",
    "alias": "OWEB Update",
    "sqlType": "sqlTypeOther",
    "nullable": true,
    "editable": true,
    "domain": null,
    "defaultValue": null
},
{
    "name": "CreationDate",
    "type": "esriFieldTypeDate",
    "alias": "CreationDate",
    "sqlType": "sqlTypeOther", "length": 8,
    "nullable": true,
    "editable": false,
    "domain": null,
    "defaultValue": null
},
{
    "name": "Creator",
    "type": "esriFieldTypeString",
    "alias": "Creator",
    "sqlType": "sqlTypeOther", "length": 50,
    "nullable": true,
    "editable": false,
    "domain": null,
    "defaultValue": null
},
{
    "name": "EditDate",
    "type": "esriFieldTypeDate",
    "alias": "EditDate",
    "sqlType": "sqlTypeOther", "length": 8,
    "nullable": true,
    "editable": false,
    "domain": null,
    "defaultValue": null
},
{
    "name": "Editor",
    "type": "esriFieldTypeString",
    "alias": "Editor",
    "sqlType": "sqlTypeOther", "length": 50,
    "nullable": true,
    "editable": false,
    "domain": null,
    "defaultValue": null
}];
