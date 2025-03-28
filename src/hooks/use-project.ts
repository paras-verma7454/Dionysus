
import { api } from '~/trpc/react';
import { useLocalStorage } from 'usehooks-ts';

const useProject = () => {
       const {data:projects}= api.project.getProjects.useQuery();
       const [projectId,setProjectId]= useLocalStorage('dionysus-project-id', '');
       const project = projects?.find((project) => project.id === projectId);
       return {
        project,
        projects,
        projectId,
        setProjectId,
       };
}

export default useProject