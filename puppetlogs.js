/*
 * Copyright: Japannext Co., Ltd. <https://www.japannext.co.jp/>
 * SPDX-License-Identifier: Apache-2.0
*/

$(function(){

    reportDate = null;
    todayString = null;

    changeDate = function(offset) {
        // Operate in local time, even though all calls assume UTC
        today = new Date();
        today = new Date(today.getTime() - today.getTimezoneOffset() * 60 * 1000);
        todayString = today.toISOString().slice(0, 10);

        if (offset == null) {
            reportDate = null;
            $("#date_selector")[0].value = null
        } else {
            if (reportDate == null) {
                reportDate = new Date(today.getTime());
            }
            reportDate.setDate(reportDate.getDate() + offset);
            $("#date_selector")[0].value = reportDate.toISOString().slice(0, 10);
        }
    }

    changeDate();

    // Overridable in puppetlogs.local.js
    if (typeof(ownerToRoles) == 'undefined')
    {
        ownerToRoles = {
            "Team 1": [
                "role1",
                "role2",
                "prefix:role3",
            ],
            "Team 2": [
                "role3",
                "role4",
                "prefix:*",
            ],
        }
    }

    roleToOwner = {}

    for (const[owner, roles] of Object.entries(ownerToRoles)) {
        for (const role of roles) {
            roleToOwner[role] = owner;
        }
    }

    for (const[owner, roles] of Object.entries(ownerToRoles)) {
        for (const role of roles) {
            roleToOwner[role] = owner;
        }
    }

    // Overridable in puppetlogs.local.js
    if (typeof(permanentConfig) == 'undefined')
    {
        permanentConfig = {}
        // Example of how to set meaningful derived attributes. This
        // demonstrates what you could do if your hosts are using a naming
        // convention of <prefix>-<role><number>
        permanentConfig.derivedAttributes = {
            "host_prefix": function(record) {
                let result = null;
                if (result = record.hostname.match(/^([^-]+)-([^-]+)(\d+)/))
                {
                    return result[1];
                }
                return result;
            },
            "host_role": function(record) {
                let result = null;
                if (result = record.hostname.match(/^([^-]+)-([^-]+)(\d+)/))
                {
                    return result[2];
                }
                return result;
            },
            "host_index": function(record) {
                let result = null;
                if (result = record.hostname.match(/^([^-]+)-([^-]+)(\d+)/))
                {
                    return result[3];
                }
                return result;
            },
            "host_owner": function(record) {
                return roleToOwner[ `${record.host_prefix}:${record.host_role}` ] || roleToOwner[ `${record.host_prefix}:*` ] || roleToOwner[record.host_role] || "";
            },
        }
    }

    permanentConfig.onRefresh = function(currentConfig) {
        var savedConfig = JSON.parse(JSON.stringify(currentConfig));
        //delete some values which are functions
        delete savedConfig["aggregators"];
        delete savedConfig["renderers"];
        //delete some bulky default values
        delete savedConfig["rendererOptions"];
        delete savedConfig["localeStrings"];
        delete savedConfig["inclusionsInfo"];
        //delete attributes we do not customize
        delete savedConfig["derivedAttributes"];
        delete savedConfig["hiddenAttributes"];
        delete savedConfig["hiddenFromAggregators"];
        delete savedConfig["hiddenFromDragDrop"];
        delete savedConfig["sorters"];
        delete savedConfig["showUI"];
        delete savedConfig["autoSortUnusedAttrs"];
        for (var key of Object.keys(currentConfig.inclusions))
        {
            if (currentConfig.inclusions[key].length < currentConfig.exclusions[key].length)
            {
                delete savedConfig["exclusions"][key];
            } else {
                delete savedConfig["inclusions"][key];
            }
        }

        customConfig = savedConfig;
        syncConfigs();
    }

    // Overridable in puppetlogs.local.js
    if (typeof(defaultConfig) == 'undefined')
    {
        defaultConfig = {
            cols: [ "resource_type" ],
            rows: [
                "age",
                "date",
                "environment",
                "host_prefix",
                "host_role",
                "host_index",
                "hostname",
            ],
            inclusions: { },
            exclusions: { },
            rowOrder: "value_z_to_a",
            colOrder: "value_z_to_a",
            rendererName: "Heatmap",
            unusedAttrsVertical: true,
            menuLimit: 5000,
        }
    }

    customConfig = {};

    liveConfig = function() {
        return Object.assign({}, defaultConfig, customConfig, permanentConfig);
    };

    // Overridable in puppetlogs.local.js
    if (typeof(configTemplates) == 'undefined')
    {
        configTemplates = [];

        configTemplates.push(["⬇️ Choose a template to load ⬇️", {}]);
        configTemplates.push(["Reset to defaults", {}]);
        configTemplates.push(["Unreported hosts", {
            "cols": [],
            "rows": [
                "age",
                "date",
                "host_owner",
                "environment",
                "host_prefix",
                "host_role",
                "host_index",
            ],
            "vals": [
                "hostname",
            ],
            "inclusions": {},
            "exclusions": {
                "age": [
                    "0",
                ],
            },
            "rowOrder": "key_a_to_z",
            "colOrder": "key_a_to_z",
            "aggregatorName": "Count Unique Values",
        }]);
        configTemplates.push(["Failed hosts", {
            "cols": [
                "environment",
            ],
            "rows": [
                "age",
                "date",
                "host_owner",
                "hostname",
            ],
            "inclusions": {
                "run_status": [
                    "failed",
                ],
            },
            "rowOrder": "key_a_to_z",
            "colOrder": "key_a_to_z",
            "aggregatorName": "List Unique Values",
            "vals": [ "run_status", ],
        }]);
        configTemplates.push(["Failed resources", {
            "cols": [
                "environment",
            ],
            "rows": [
                "age",
                "date",
                "host_owner",
                "resource_type",
                "resource_title",
                "host_role",
                "host_prefix",
            ],
            "inclusions": {
                "status": [
                    "failure",
                ],
                "age": [
                    "0",
                ],
            },
            "rowOrder": "key_a_to_z",
            "colOrder": "key_a_to_z",
            "aggregatorName": "Integer Sum",
            "vals": [ "changes", ],
        }]);

        configTemplates.push(["Owner: (Summarized)", {
            "cols": [
                "environment",
            ],
            "rows": [
                "age",
                "date",
                "host_owner",
            ],
            "vals": [ "changes", ],
            "rowOrder": "key_a_to_z",
            "colOrder": "key_a_to_z",
            "inclusions": {},
            "rendererName": "Heatmap",
            "aggregatorName": "Integer Sum"
        }]);

        for (const[owner, roles] of Object.entries(ownerToRoles)) {
            configTemplates.push( [`Owner: ${owner}`, {
                inclusions: {
                    host_owner: [ owner ],
                },
                cols: [
                    "environment",
                ],
                rows: [
                    "age",
                    "date",
                    "host_owner",
                    "host_role",
                ],
                vals: [ "changes", ],
                aggregatorName: "Integer Sum",
            }]);
        }

        configTemplates.push(["Resource types per host", {
                cols: [ "resource_type" ],
                rows: [ "age", "date", "hostname", "environment" ],
                colOrder: "value_z_to_a",
                rowOrder: "value_z_to_a",
        }]);


    }

    syncConfigs = function() {
        $("#bookmark")[0].href = "#" + encodeURIComponent(JSON.stringify(liveConfig()));
        document.location.hash = "#" + encodeURIComponent(JSON.stringify(liveConfig()));
        $("#custom_configuration_content")[0].value = JSON.stringify(liveConfig(), undefined, 2);
        $("#custom_configuration_container, #current_file").each(function () {
            this.classList.remove("active");
            this.classList.remove("error");
            this.classList.add("ready");
        });
    }

    loadBookmarkedConfig = function() {
        if ( $(location).attr('hash').length > 1 )
        {
            try {
                customConfig = JSON.parse(decodeURIComponent($(location).attr('hash').slice(1)));
            } catch (error) {
                if (error instanceof SyntaxError) {
                    console.log(error);
                } else {
                    throw error;
                }
            }
        }
    }

    loadBookmarkedConfig();

    for (const [key, value] of configTemplates) {
        var option = document.createElement('option');
        option.value = key;
        option.innerText = key;
        $("#configuration")[0].appendChild(option);
    }

    pvt_data = []

    renderTable = function() {
        $("#output").pivotUI(pvt_data, liveConfig(), true );
    };

    loadFile = function() {
        report_suffix = "latest"
        if (reportDate != null) {
            report_suffix = reportDate.toISOString().slice(0,10);
        }

        datafile = `puppetlogs-${report_suffix}.json`;
        $("#current_file")[0].innerText = report_suffix;
        $("#current_file")[0].href = `.data/${datafile}`;
        $("#current_file").each( function() {
            this.classList.remove("ready");
            this.classList.remove("error");
            this.classList.add("active");
        });
        $.getJSON(`.data/${datafile}?ts=${Math.floor(Date.now() / 600_000)}`, function(loaded_data) {
            pvt_data = loaded_data;
            renderTable();
        })
        .fail( function() {
            $("#current_file").each( function() {
                this.classList.remove("ready");
                this.classList.remove("active");
                this.classList.add("error");
            });
        })
        ;
    }

    $("#rotate_button").on("click", function() {
        customConfig.unusedAttrsVertical = ! liveConfig().unusedAttrsVertical
        renderTable();
    });

    $("#configuration").on("change", function() {
        if ($("#configuration")[0].selectedIndex != 0)
        {
            customConfig = configTemplates[$("#configuration")[0].selectedIndex][1];
            $("#configuration")[0].selectedIndex = 0;
            renderTable();
        }
    });

    $("#next_day").on("click", function() {
        changeDate(1);
        loadFile();
    });
    $("#last_day").on("click", function() {
        changeDate(-1);
        loadFile();
    });
    $("#latest").on("click", function() {
        changeDate();
        loadFile();
    });
    $("#filter_prod").on("click", function() {
        var environments = {};
        pvt_data.forEach( (o) => { environments[o.environment] = 1; });
        delete customConfig.exclusions.environment;
        customConfig.inclusions.environment = [];
        Object.keys(environments).forEach( (e) => {
            e.match(/production$/) && customConfig.inclusions.environment.push(e);
        });
        renderTable();
    });
    $("#filter_age").on("click", function() {
        delete customConfig.exclusions.age;
        customConfig.inclusions.age = [ "0" ];
        renderTable();
    });
    $("#filter_changes").on("click", function() {
        delete customConfig.inclusions.changes;
        customConfig.exclusions.changes = [ "0" ];
        renderTable();
    });
    $("#date_selector").on("change", function() {
        reportDate = new Date(Date.parse(this.value));
        changeDate(0);
        loadFile();
    });

    $("#custom_configuration_button").on("click", function() {
        try {
            $("#custom_configuration_container").each( function() {
                this.classList.remove("ready");
                this.classList.remove("error");
                this.classList.add("active");
            });
            customConfig = JSON.parse($("#custom_configuration_content")[0].value);
            renderTable();
        } catch (error) {
            $("#custom_configuration_container").each( function() {
                this.classList.remove("ready");
                this.classList.remove("active");
                this.classList.add("error");
            });
        }
    });

    loadFile();

});
