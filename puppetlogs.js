$(function(){

    report_date = null;
    today_string = null;
    yesterday_string = null;

    changeDate = function(offset) {
        // Operate in local time, even though all calls assume UTC
        today = new Date();
        today = new Date(today.getTime() - today.getTimezoneOffset() * 60 * 1000);
        today_string = today.toISOString().slice(0, 10);

        yesterday = new Date(today.getTime());
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday_string = yesterday.toISOString().slice(0, 10);

        if (offset == null) {
            report_date = null;
            $("#date_selector")[0].value = null
        } else {
            if (report_date == null) {
                report_date = new Date(today.getTime());
            }
            report_date.setDate(report_date.getDate() + offset);
            $("#date_selector")[0].value = report_date.toISOString().slice(0, 10);
        }
    }

    changeDate();

    // Overridable in puppetlogs.local.js
    if (typeof(owner_to_roles) == 'undefined')
    {
        owner_to_roles = {
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

    role_to_owner = {}

    for (const[owner, roles] of Object.entries(owner_to_roles)) {
        for (const role of roles) {
            role_to_owner[role] = owner;
        }
    }

    for (const[owner, roles] of Object.entries(owner_to_roles)) {
        for (const role of roles) {
            role_to_owner[role] = owner;
        }
    }

    // Overridable in puppetlogs.local.js
    if (typeof(permanentConfig) == 'undefined')
    {
        permanentConfig = {}
    }

    permanentConfig.onRefresh = function(current_config) {
        var saved_config = JSON.parse(JSON.stringify(current_config));
        //delete some values which are functions
        delete saved_config["aggregators"];
        delete saved_config["renderers"];
        //delete some bulky default values
        delete saved_config["rendererOptions"];
        delete saved_config["localeStrings"];
        delete saved_config["inclusionsInfo"];
        //delete attributes we do not customize
        delete saved_config["derivedAttributes"];
        delete saved_config["hiddenAttributes"];
        delete saved_config["hiddenFromAggregators"];
        delete saved_config["hiddenFromDragDrop"];
        delete saved_config["sorters"];
        delete saved_config["showUI"];
        delete saved_config["autoSortUnusedAttrs"];
        for (var key of Object.keys(current_config.inclusions))
        {
            if (current_config.inclusions[key].length < current_config.exclusions[key].length)
            {
                delete saved_config["exclusions"][key];
            } else {
                delete saved_config["inclusions"][key];
            }
        }

        customConfig = saved_config;
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
        configTemplates.push([ "", {}]);
        configTemplates.push(["Default", {}]);
        configTemplates.push([ "", {}]);

        configTemplates.push([">> Filtered by team <<", {}]);

        for (const[owner, roles] of Object.entries(owner_to_roles)) {
            configTemplates.push( [`Team - ${owner}`, {
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

        configTemplates.push([ "", {}]);

        configTemplates.push(["SSH keys per host prefix", {
            rows: [ "host_prefix" ],
            cols: [ "resource_type", "property", "new_value", ],
            rowOrder: "value_z_to_a",
            inclusions: { "resource_type": [ "Sshkey" ], "environment": [ "production", "cloud_production", "jgb_production" ], "property": [ "ensure" ] },
            aggregatorName: "Count Unique Values",
            vals: [ "hostname" ],

        }]);
        configTemplates.push(["Resource types per host", {
                cols: [ "resource_type" ],
                rows: [ "age", "date", "hostname", "environment" ],
                rowOrder: "key_a_to_z",
        }]);

        configTemplates.push(["Changes per team", {
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

        Object.assign(defaultConfig, configTemplates[configTemplates.length - 1][1]);

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
        if (report_date != null) {
            report_suffix = report_date.toISOString().slice(0,10);
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
        report_date = new Date(Date.parse(this.value));
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
