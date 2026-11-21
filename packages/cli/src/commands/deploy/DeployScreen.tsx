import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { SelectOption } from "@opentui/core";
import { useOrganizations } from "../../hooks/useOrganizations";
import { useProjects } from "../../hooks/useProjects";
import { readBuiltModule } from "./readBuiltModule";
import {
    completeDeploy,
    deployTarget,
    missingDeployTargetMessage,
    type DeployFlags,
} from "./runDeploy";
import { errorText } from "../../lib/exit";
import type { PluvConfig } from "../../schemas";
import { ChoiceList } from "../../components/ChoiceList";
import { palette } from "../../log/palette";
import { Status } from "../../components/Status";
import type { ScreenProps } from "../shared/types";

/** Upload when the organization and project are already known. */
export const runDeployCommand = async (config: PluvConfig, flags: DeployFlags): Promise<string> => {
    const target = deployTarget({ config, flags });

    if (!target.organization || !target.project) {
        throw new Error(missingDeployTargetMessage(target.organization, target.project));
    }

    const module = await readBuiltModule(config.distDir);

    return completeDeploy({
        cwd: process.cwd(),
        module,
        organization: target.organization,
        project: target.project,
        save: false,
    });
};

const DeployFlow = ({ config, done, flags, warning }: ScreenProps & { flags: DeployFlags }) => {
    const initial = deployTarget({ config, flags });
    const needsPrompt = !initial.organization || !initial.project;
    const [organization, setOrganization] = useState(initial.organization);
    const [project, setProject] = useState(initial.project);
    const [save, setSave] = useState<boolean | null>(needsPrompt ? null : false);
    const started = useRef(false);
    const moduleQuery = useQuery({
        queryFn: () => readBuiltModule(config.distDir),
        queryKey: ["deploy", "module", config.distDir],
    });
    const askOrganizations = moduleQuery.isSuccess && !organization;
    const askProjects = moduleQuery.isSuccess && Boolean(organization) && !project;
    const organizations = useOrganizations({
        cwd: process.cwd(),
        enabled: askOrganizations,
    });
    const projects = useProjects({
        cwd: process.cwd(),
        enabled: askProjects,
        organization: organization ?? "",
    });
    const {
        fetchingMore: organizationsFetchingMore,
        hasNextPage: organizationsHasNextPage,
        loadMore: loadMoreOrganizations,
    } = organizations;
    const {
        fetchingMore: projectsFetchingMore,
        hasNextPage: projectsHasNextPage,
        loadMore: loadMoreProjects,
    } = projects;
    const deploy = useMutation({
        mutationFn: completeDeploy,
        onError: (caught: unknown) => {
            done(errorText(caught, "Deploy failed."), 1);
        },
        onSuccess: (text) => {
            done(text, 0);
        },
    });

    useEffect(() => {
        if (!moduleQuery.isError) return;

        done(errorText(moduleQuery.error, "Deploy failed."), 1);
    }, [done, moduleQuery.error, moduleQuery.isError]);

    useEffect(() => {
        if (organizations.error) done(organizations.error.message, 1);
    }, [done, organizations.error]);

    useEffect(() => {
        if (projects.error) done(projects.error.message, 1);
    }, [done, projects.error]);

    useEffect(() => {
        if (!askOrganizations || !organizations.empty) return;

        done("No organizations were found for this login.", 1);
    }, [askOrganizations, done, organizations.empty]);

    useEffect(() => {
        if (!askProjects || !projects.empty || !organization) return;

        done(`No projects were found in ${organization}.`, 1);
    }, [askProjects, done, organization, projects.empty]);

    useEffect(() => {
        if (!askOrganizations || !organizationsHasNextPage || organizationsFetchingMore) return;

        loadMoreOrganizations();
    }, [
        askOrganizations,
        loadMoreOrganizations,
        organizationsFetchingMore,
        organizationsHasNextPage,
    ]);

    useEffect(() => {
        if (!askProjects || !projectsHasNextPage || projectsFetchingMore) return;

        loadMoreProjects();
    }, [askProjects, loadMoreProjects, projectsFetchingMore, projectsHasNextPage]);

    useEffect(() => {
        if (started.current || !moduleQuery.data || !organization || !project) return;
        if (needsPrompt && save === null) return;

        started.current = true;
        deploy.mutate({
            cwd: process.cwd(),
            module: moduleQuery.data,
            organization,
            project,
            save: needsPrompt && save === true,
        });
    }, [deploy, moduleQuery.data, needsPrompt, organization, project, save]);

    if (moduleQuery.isPending || deploy.isPending || deploy.isSuccess) {
        return <Status label="Deploying" />;
    }

    if (moduleQuery.isError || deploy.isError) return null;

    if (!organization) {
        return (
            <box style={{ flexDirection: "column", padding: 1 }}>
                {warning ? <text fg={palette.muted}>{warning}</text> : null}
                <ChoiceList
                    description={(item) => item.slug}
                    list={organizations}
                    loading="Loading organizations"
                    name={(item) => item.name}
                    title="Organization"
                    value={(item) => item.slug}
                    onSelect={setOrganization}
                />
            </box>
        );
    }

    if (!project) {
        return (
            <box style={{ flexDirection: "column", padding: 1 }}>
                {warning ? <text fg={palette.muted}>{warning}</text> : null}
                <ChoiceList
                    description={(item) => item.urlSlug}
                    list={projects}
                    loading="Loading projects"
                    name={(item) => item.name}
                    title="Project"
                    value={(item) => item.urlSlug}
                    onSelect={setProject}
                />
            </box>
        );
    }

    if (needsPrompt && save === null) {
        const options: SelectOption[] = [
            { description: "", name: "No", value: false },
            { description: "", name: "Yes", value: true },
        ];

        return (
            <box style={{ flexDirection: "column", padding: 1 }}>
                <text>Save organization and project in the pluv config?</text>
                <select
                    focused
                    options={options}
                    showDescription={false}
                    style={{ height: options.length }}
                    onSelect={(_index, option) => {
                        if (typeof option?.value === "boolean") setSave(option.value);
                    }}
                />
            </box>
        );
    }

    return <Status label="Deploying" />;
};

export const DeployScreen = (props: ScreenProps & { flags: DeployFlags }) => {
    return <DeployFlow {...props} />;
};
