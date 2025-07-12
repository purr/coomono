import React from "react";
import styled from "styled-components";
import { useParams, useLocation } from "react-router-dom";
import { handleLinkInteraction } from "../utils/helpers";
import { useNavigate } from "react-router-dom";
import { ApiService } from "../services/api";
import { useNavigation } from "../context/NavigationContext";

const BreadcrumbContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 1.5rem 0.5rem 1rem;
  margin-bottom: 1rem;
  overflow-x: auto;
  white-space: nowrap;
  font-size: 0.95rem;
`;

const BreadcrumbItem = styled.a<{ isLast?: boolean }>`
  color: ${({ theme, isLast }) => (isLast ? theme.subtle : theme.text)};
  font-weight: bold;
  text-decoration: none;
  transition: color 0.2s ease;
  cursor: ${({ isLast }) => (isLast ? "default" : "pointer")};

  &:hover {
    color: ${({ theme, isLast }) => (isLast ? theme.subtle : theme.foam)};
    text-decoration: none;
  }
`;

const Separator = styled.span`
  margin: 0 0.5rem;
  color: ${({ theme }) => theme.subtle};
`;

const BreadcrumbNavigation: React.FC = () => {
  const { instance, service, id, postId } = useParams<{
    instance?: string;
    service?: string;
    id?: string;
    postId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const apiService = new ApiService();
  const { startNavigation } = useNavigation();
  const currentInstance = apiService.getCurrentApiInstance();
  const availableInstances = apiService.getAvailableInstances();

  // Build breadcrumb items based on the current route
  const breadcrumbs = [];

  // Home - always present
  const homeUrl = "/";
  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    startNavigation();
    navigate(homeUrl);
  };
  breadcrumbs.push({
    name: "Coomono",
    url: homeUrl,
    clickHandler: handleHomeClick,
  });

  // Instance
  if (instance) {
    const instanceUrl = `/${instance}`;
    const handleInstanceClick = (e: React.MouseEvent) => {
      e.preventDefault();
      startNavigation();
      navigate(instanceUrl);
    };

    // Find the instance name from the available instances
    const instanceObj = availableInstances.find((api) => api.url === instance);
    const instanceName = instanceObj ? instanceObj.name : instance;

    breadcrumbs.push({
      name: instanceName,
      url: instanceUrl,
      clickHandler: handleInstanceClick,
    });

    // Service
    if (service) {
      const serviceUrl = `/${instance}`;
      const handleServiceClick = (e: React.MouseEvent) => {
        e.preventDefault();
        startNavigation();
        navigate(serviceUrl);
      };
      breadcrumbs.push({
        name: service,
        url: serviceUrl,
        clickHandler: handleServiceClick,
      });

      // Creator
      if (id) {
        const creatorUrl = `/${instance}/${service}/user/${id}`;
        const handleCreatorClick = (e: React.MouseEvent) => {
          e.preventDefault();
          startNavigation();
          navigate(creatorUrl);
        };

        // Try to get creator name from URL or just display ID
        let creatorName = id;

        // Add creator to breadcrumbs
        breadcrumbs.push({
          name: creatorName,
          url: creatorUrl,
          clickHandler: handleCreatorClick,
        });

        // Post
        if (postId) {
          const postUrl = `/${instance}/${service}/user/${id}/post/${postId}`;
          const handlePostClick = (e: React.MouseEvent) => {
            e.preventDefault(); // Even for the current page, prevent default
          };
          breadcrumbs.push({
            name: "Post",
            url: postUrl,
            clickHandler: handlePostClick,
          });
        }
      }
    }
  }

  return (
    <BreadcrumbContainer>
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        // Only apply click handlers if not the last item
        const linkProps = !isLast
          ? handleLinkInteraction(
            crumb.url,
            crumb.clickHandler,
            startNavigation
          )
          : {};

        return (
          <React.Fragment key={index}>
            {isLast ? (
              <BreadcrumbItem as="span" isLast={isLast}>
                {crumb.name}
              </BreadcrumbItem>
            ) : (
              <BreadcrumbItem href={crumb.url} {...linkProps} isLast={isLast}>
                {crumb.name}
              </BreadcrumbItem>
            )}
            {!isLast && <Separator>/</Separator>}
          </React.Fragment>
        );
      })}
    </BreadcrumbContainer>
  );
};

export default BreadcrumbNavigation;
